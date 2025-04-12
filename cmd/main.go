package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
)

type Message struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload,omitempty"`
	Url     string      `json:"url,omitempty"`
	Content string      `json:"content,omitempty"`
}

type Track struct {
	Id     string `json:"id"`
	Name   string `json:"name"`
	Artist string `json:"artist"`
}

func sendMessage(message Message) error {
	bytes, err := json.Marshal(message)
	if err != nil {
		return err
	}

	// Send message length
	fmt.Printf("%d\n", len(bytes))
	// Send message
	fmt.Print(string(bytes))
	return nil
}

func readMessage() (Message, error) {
	// Read message length
	reader := bufio.NewReader(os.Stdin)
	var length int
	_, err := fmt.Fscanln(reader, &length)
	if err != nil {
		return Message{}, err
	}

	// Read message
	messageBytes := make([]byte, length)
	_, err = reader.Read(messageBytes)
	if err != nil {
		return Message{}, err
	}

	var message Message
	err = json.Unmarshal(messageBytes, &message)
	if err != nil {
		return Message{}, err
	}

	return message, nil
}

func main() {
	//send a start message
	err := sendMessage(Message{Type: "message", Content: "App started"})
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error sending message: %v\n", err)
		os.Exit(1)
	}
	for {
		// Read message from extension
		message, err := readMessage()
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error reading message: %v\n", err)
			os.Exit(1)
		}

		fmt.Fprintf(os.Stderr, "Received message: %v\n", message)

		if message.Type == "download" {
			fmt.Fprintf(os.Stderr, "Download will start\n")
			// Simulate download for each track
			tracks, ok := message.Payload.([]interface{})
			if !ok {
				fmt.Fprintf(os.Stderr, "Invalid payload\n")
				return
			}
			for _, trackData := range tracks {
				trackMap, ok := trackData.(map[string]interface{})
				if !ok {
					fmt.Fprintf(os.Stderr, "Invalid track data\n")
					return
				}
				track := Track{
					Id:     trackMap["id"].(string),
					Name:   trackMap["name"].(string),
					Artist: trackMap["artist"].(string),
				}
				sendMessage(Message{Type: "progress", Payload: track, Content: "downloading"})
				// Simulate download time
				//time.Sleep(2 * time.Second)
				sendMessage(Message{Type: "progress", Payload: track, Content: "completed"})
			}
		} else if message.Url != "" {
			fmt.Fprintf(os.Stderr, "Url will be processed\n")
			err = sendMessage(Message{Type: "message", Content: fmt.Sprintf("Url received: %v", message.Url)})
			if err != nil {
				fmt.Fprintf(os.Stderr, "Error sending message: %v\n", err)
				os.Exit(1)
			}
		} else {
			fmt.Fprintf(os.Stderr, "Received invalid message: %v\n", message)
			os.Exit(1)
		}
	}
}