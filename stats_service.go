package main

import (
	"log"
	"math"
	"time"
)

func StartStatsCollector() {
	// Миграция БД
	err := DB.AutoMigrate(&SystemMetric{})
	if err != nil {
		log.Printf("Failed to migrate metrics: %v", err)
	}

	ticker := time.NewTicker(1 * time.Minute)
	go func() {
		for range ticker.C {
			stats, err := GetSystemStats()
			if err != nil {
				log.Printf("Error collecting stats: %v", err)
				continue
			}

			metric := SystemMetric{
				CreatedAt: time.Now(),
				CPU:       stats.CPUPercent,
				Memory:    stats.MemoryUsed,
				Disk:      stats.DiskUsed,
			}

			if err := DB.Create(&metric).Error; err != nil {
				log.Printf("Error saving metric: %v", err)
			}

			// ОЧИСТКА: Удаляем данные старше 25 часов (чтобы был запас для графика 24h)
			// Запускаем проверку раз в 10 минут
			if time.Now().Minute()%10 == 0 {
				expiration := time.Now().Add(-25 * time.Hour)
				DB.Where("created_at < ?", expiration).Delete(&SystemMetric{})
			}
		}
	}()
}

func GetStatsHistory(period string) ([]SystemMetric, error) {
	var metrics []SystemMetric
	var since time.Time

	switch period {
	case "1h":
		since = time.Now().Add(-1 * time.Hour)
	case "24h":
		since = time.Now().Add(-24 * time.Hour)
	default:
		// По дефолту 1 час
		since = time.Now().Add(-1 * time.Hour)
	}

	// Берем данные
	if err := DB.Where("created_at >= ?", since).Order("created_at asc").Find(&metrics).Error; err != nil {
		return nil, err
	}

	// Прореживание точек (Downsampling)
	// Для графика 24ч (1440 минут) нам не нужно 1440 точек, хватит ~300
	targetPoints := 300
	totalPoints := len(metrics)

	if totalPoints <= targetPoints {
		return metrics, nil
	}

	step := float64(totalPoints) / float64(targetPoints)
	var result []SystemMetric

	for i := 0.0; i < float64(totalPoints); i += step {
		idx := int(math.Floor(i))
		if idx < totalPoints {
			result = append(result, metrics[idx])
		}
	}

	return result, nil
}