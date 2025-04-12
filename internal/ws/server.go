package ws

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Message struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

func StartWebSocketServer(port string) {
	http.HandleFunc("/", HandleConnection)
	log.Printf("WebSocket server listening on port %s", port)
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatalf("ListenAndServe error: %v", err)
	}
}

func HandleConnection(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Upgrade error: %v", err)
		return
	}
	defer conn.Close()

	log.Println("New client connected")

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Printf("Read error: %v", err)
			break
		}

		var message Message
		err = json.Unmarshal(msg, &message)
		if err != nil {
			log.Printf("Unmarshal error: %v", err)
			continue
		}

		switch message.Type {
		case "download":
			handleDownloadRequest(conn, message.Payload)
		default:
			log.Printf("Unknown message type: %s", message.Type)
		}
	}
}

func SendMessage(conn *websocket.Conn, msgType string, payload interface{}) {
	message := Message{
		Type:    msgType,
		Payload: payload,
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Marshal error: %v", err)
		return
	}

	err = conn.WriteMessage(websocket.TextMessage, messageBytes)
	if err != nil {
		log.Println("Write error:", err)
	}
}

func handleDownloadRequest(conn *websocket.Conn, payload interface{}) {
	tracks, ok := payload.([]interface{})
	if !ok {
		log.Println("Invalid payload type for download request")
		SendMessage(conn, "error", "Invalid payload type")
		return
	}

	for _, trackData := range tracks {
		track, ok := trackData.(map[string]interface{})
		if !ok {
			log.Println("Invalid track data format")
			SendMessage(conn, "error", "Invalid track data format")
			continue
		}
		trackName, ok := track["name"].(string)
		if !ok {
			log.Println("Invalid track name format")
			SendMessage(conn, "error", "Invalid track name format")
			continue
		}
		fmt.Println("Downloading:", trackName)
		SendMessage(conn, "downloading", trackName)

		err := processTrack(track)
		if err != nil {
			log.Printf("Error processing track %s: %v", trackName, err)
			SendMessage(conn, "error", fmt.Sprintf("Error processing track %s: %v", trackName, err))
			continue
		}
		SendMessage(conn, "completed", trackName)
	}
}

func processTrack(track map[string]interface{}) error {
	trackName, ok := track["name"].(string)
	if !ok {
		return fmt.Errorf("invalid track name format")
	}
	log.Println("processing track:", trackName)
	// Implement your track download logic here, this is just a placeholder
	// you should call your download functions here

	// Simulate downloading and check for errors
	// Replace this with your actual download logic
	// For example:
	// if err := DownloadTrack(trackURL, destinationPath); err != nil {
	//     return fmt.Errorf("download error: %w", err)
	// }

	return nil
}