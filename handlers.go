package main

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	api := app.Group("/api")

	// Эндпоинт для Splash Screen и Docker Healthcheck
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.SendStatus(200)
	})

	api.Get("/containers", func(c *fiber.Ctx) error {
		containers, err := GetContainers()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		return c.JSON(containers)
	})

	api.Get("/stats/host", func(c *fiber.Ctx) error {
		stats, err := GetSystemStats()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		return c.JSON(stats)
	})

	// NEW: Endpoint для истории
	api.Get("/stats/history", func(c *fiber.Ctx) error {
		period := c.Query("period", "1h")
		history, err := GetStatsHistory(period)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		return c.JSON(history)
	})

	api.Get("/containers/:id/stats", func(c *fiber.Ctx) error {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		
		stats, err := GetContainerMemUsage(ctx, c.Params("id"))
		if err != nil {
			return c.JSON(fiber.Map{})
		}
		return c.JSON(stats)
	})

	api.Post("/settings/container", func(c *fiber.Ctx) error {
		var payload ContainerSettings
		if err := c.BodyParser(&payload); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
		}

		var settings ContainerSettings
		DB.FirstOrInit(&settings, ContainerSettings{ID: payload.ID})

		settings.Alias = payload.Alias
		settings.Icon = payload.Icon
		settings.GroupName = payload.GroupName

		if err := DB.Save(&settings).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to save settings"})
		}

		return c.JSON(settings)
	})

	api.Get("/settings", func(c *fiber.Ctx) error {
		var settings AppSettings
		if err := DB.First(&settings).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch settings"})
		}
		return c.JSON(settings)
	})

	api.Post("/containers/:id/:action", func(c *fiber.Ctx) error {
		id := c.Params("id")
		action := c.Params("action")

		if action != "start" && action != "stop" && action != "restart" && action != "remove" {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid action"})
		}

		if err := ControlContainer(id, action); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}

		return c.SendStatus(200)
	})

	app.Static("/", "./frontend/dist")

	// SPA Fallback: Для любого маршрута, не являющегося API или файлом, отдаем index.html
	app.Get("*", func(c *fiber.Ctx) error {
		// Важно для React Router: всегда отдавать index.html на неизвестные пути
		return c.SendFile("./frontend/dist/index.html")
	})
}