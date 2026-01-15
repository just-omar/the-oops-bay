package main

import (
	"log"
	"os"

	"github.com/glebarez/sqlite" // <--- НОВЫЙ ДРАЙВЕР (БЕЗ CGO)
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func InitDB() {
	if _, err := os.Stat("data"); os.IsNotExist(err) {
		os.Mkdir("data", 0755)
	}

	var err error
	DB, err = gorm.Open(sqlite.Open("data/the-oops-bay.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	err = DB.AutoMigrate(&ContainerSettings{}, &AppSettings{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	var settings AppSettings
	if result := DB.First(&settings); result.Error != nil {
		DB.Create(&AppSettings{Theme: "dark", Language: "en"})
	}
}