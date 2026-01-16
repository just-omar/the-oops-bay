package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
)

var dockerClient *client.Client

func InitDocker() error {
	var err error
	dockerClient, err = client.NewClientWithOpts(
		client.FromEnv,
		client.WithAPIVersionNegotiation(),
	)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	_, err = dockerClient.Ping(ctx)
	if err != nil {
		log.Printf("Error connecting to Docker: %v", err)
	}
	return nil
}

// GetLocalIP возвращает локальный IP (запасной вариант)
func GetLocalIP() string {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		return "127.0.0.1"
	}
	defer conn.Close()
	localAddr := conn.LocalAddr().(*net.UDPAddr)
	return localAddr.IP.String()
}

// GetPublicIP пытается получить белый IP, если не выйдет — вернет локальный
func GetPublicIP() string {
	// Создаем клиент с таймаутом, чтобы не зависать, если нет инета
	client := http.Client{
		Timeout: 2 * time.Second,
	}

	resp, err := client.Get("https://api.ipify.org?format=text")
	if err != nil {
		// Если не удалось узнать белый IP (нет интернета), отдаем локальный
		return GetLocalIP()
	}
	defer resp.Body.Close()

	ip, err := io.ReadAll(resp.Body)
	if err != nil {
		return GetLocalIP()
	}

	return string(ip)
}

func GetSystemStats() (SystemStats, error) {
	v, _ := mem.VirtualMemory()
	cPercent, _ := cpu.Percent(0, false)
	cCounts, _ := cpu.Counts(true)
	d, _ := disk.Usage("/")
	hInfo, _ := host.Info()

	cpuVal := 0.0
	if len(cPercent) > 0 {
		cpuVal = cPercent[0]
	}

	return SystemStats{
		CPUPercent:  cpuVal,
		CPUCores:    cCounts,
		MemoryUsed:  v.Used,
		MemoryTotal: v.Total,
		DiskUsed:    d.Used,
		DiskTotal:   d.Total,
		DiskPercent: d.UsedPercent,
		HostName:    hInfo.Hostname,
		HostOS:      fmt.Sprintf("%s %s", hInfo.Platform, hInfo.PlatformVersion),
		HostIP:      GetPublicIP(), // <-- ИСПОЛЬЗУЕМ НОВУЮ ФУНКЦИЮ
		Uptime:      hInfo.Uptime,
		Timestamp:   time.Now().UnixMilli(),
	}, nil
}

type dockerStatsJSON struct {
	MemoryStats struct {
		Usage uint64 `json:"usage"`
		Limit uint64 `json:"limit"`
	} `json:"memory_stats"`
}

func GetContainerMemUsage(ctx context.Context, containerID string) (*ContainerStats, error) {
	statsResp, err := dockerClient.ContainerStats(ctx, containerID, false)
	if err != nil {
		return nil, err
	}
	defer statsResp.Body.Close()

	var stats dockerStatsJSON
	if err := json.NewDecoder(statsResp.Body).Decode(&stats); err != nil {
		return nil, err
	}

	memPercent := 0.0
	if stats.MemoryStats.Limit > 0 {
		memPercent = float64(stats.MemoryStats.Usage) / float64(stats.MemoryStats.Limit) * 100.0
	}

	return &ContainerStats{
		MemoryUsage:   stats.MemoryStats.Usage,
		MemoryLimit:   stats.MemoryStats.Limit,
		MemoryPercent: memPercent,
	}, nil
}

func GetContainers() ([]Container, error) {
	if dockerClient == nil {
		return nil, fmt.Errorf("docker client not initialized")
	}

	containers, err := dockerClient.ContainerList(context.Background(), types.ContainerListOptions{All: true})
	if err != nil {
		return nil, err
	}
	
	var allSettings []ContainerSettings
	DB.Find(&allSettings)
	settingsMap := make(map[string]ContainerSettings)
	for _, s := range allSettings {
		settingsMap[s.ID] = s
	}

	var result []Container
	for _, c := range containers {
		name := "unknown"
		if len(c.Names) > 0 {
			name = strings.TrimPrefix(c.Names[0], "/")
		}

		ports := []string{}
		for _, p := range c.Ports {
			ports = append(ports, fmt.Sprintf("%d->%d/%s", p.PublicPort, p.PrivatePort, p.Type))
		}

		settings, exists := settingsMap[c.ID]
		if !exists {
			settings = ContainerSettings{}
		}

		displayName := name
		if settings.Alias != "" {
			displayName = settings.Alias
		}

		groupName := settings.GroupName
		if groupName == "" {
			if project, ok := c.Labels["com.docker.compose.project"]; ok && project != "" {
				groupName = strings.Title(project)
			}
		}

		result = append(result, Container{
			ID:      c.ID,
			Name:    displayName,
			Image:   c.Image,
			State:   c.State,
			Status:  c.Status,
			Ports:   ports,
			Created: c.Created,
			Icon:    settings.Icon,
			Alias:   settings.Alias,
			Group:   groupName,
		})
	}
	return result, nil
}

func ControlContainer(id, action string) error {
	if dockerClient == nil {
		return fmt.Errorf("docker client not initialized")
	}
	ctx := context.Background()
	timeout := 10
	stopOptions := container.StopOptions{Timeout: &timeout}

	switch action {
	case "start":
		return dockerClient.ContainerStart(ctx, id, types.ContainerStartOptions{})
	case "stop":
		return dockerClient.ContainerStop(ctx, id, stopOptions)
	case "restart":
		return dockerClient.ContainerRestart(ctx, id, stopOptions)
	case "remove":
		return dockerClient.ContainerRemove(ctx, id, types.ContainerRemoveOptions{Force: true})
	default:
		return fmt.Errorf("unknown action: %s", action)
	}
}