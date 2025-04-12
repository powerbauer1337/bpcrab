package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/pedro-git-projects/beatport-downloader/internal/ws"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Error loading .env file")
	}

	logger := log.New(os.Stdout, "Beatport Downloader ", log.LstdFlags|log.Lshortfile)

	logger.Println("Starting Beatport Downloader")

	go func() {
		if err := ws.StartWebSocketServer(logger, "8080"); err != nil {
			log.Fatal(err)
		}
	}()

	select {}
}