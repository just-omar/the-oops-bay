package main

import (
	"time"

	"gorm.io/gorm"
)

var DB *gorm.DB

// --- Основные модели ---

type Container struct {
	ID      string          `json:"id"`
	Name    string          `json:"name"`
	Image   string          `json:"image"`
	State   string          `json:"state"`
	Status  string          `json:"status"`
	Ports   []string        `json:"ports"`
	Created int64           `json:"created"`
	Icon    string          `json:"icon"`
	Alias   string          `json:"alias"`
	Group   string          `json:"group"`
	Stats   *ContainerStats `json:"stats,omitempty" gorm:"-"`
}

type ContainerStats struct {
	MemoryUsage   uint64  `json:"memory_usage"`
	MemoryLimit   uint64  `json:"memory_limit"`
	MemoryPercent float64 `json:"memory_percent"`
	CPUPercent    float64 `json:"cpu_percent"`
}

type SystemStats struct {
	CPUPercent   float64 `json:"cpu_percent"`
	CPUCores     int     `json:"cpu_cores"`
	MemoryUsed   uint64  `json:"memory_used"`
	MemoryTotal  uint64  `json:"memory_total"`
	DiskUsed     uint64  `json:"disk_used"`
	DiskTotal    uint64  `json:"disk_total"`
	DiskPercent  float64 `json:"disk_percent"`
	HostName     string  `json:"host_name"`
	HostOS       string  `json:"host_os"`
	HostIP       string  `json:"host_ip"`
	Uptime       uint64  `json:"uptime"`
	Timestamp 	 int64 `json:"timestamp"` // Unix timestamp (секунды или миллисекунды)
}

// --- Новые модели для БД ---

// SystemMetric хранит исторические данные (снимок раз в минуту)
type SystemMetric struct {
	ID        uint      `gorm:"primaryKey" json:"-"`
	CreatedAt time.Time `json:"timestamp" gorm:"index"` // Индекс для быстрого поиска по времени
	CPU       float64   `json:"cpu"`
	Memory    uint64    `json:"memory"`
	Disk      uint64    `json:"disk"`
}

type ContainerSettings struct {
	ID        string `gorm:"primaryKey" json:"id"`
	Alias     string `json:"alias"`
	Icon      string `json:"icon"`
	GroupName string `json:"group_name"`
	Hidden    bool   `json:"hidden"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

type AppSettings struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	Theme     string `json:"theme" gorm:"default:'dark'"`
	Language  string `json:"language" gorm:"default:'en'"`
	UpdatedAt time.Time
}