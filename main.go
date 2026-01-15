package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	// Initialize Docker Client
	if err := InitDocker(); err != nil {
		log.Fatalf("Failed to init Docker: %v", err)
	}

	// Initialize Database
	InitDB()

	// NEW: Запускаем сборщик метрик
	StartStatsCollector()

	app := fiber.New()

	app.Use(cors.New())

	SetupRoutes(app)

	log.Fatal(app.Listen(":3000"))
}