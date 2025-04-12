package beatport

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"sync"
)

type Track struct {
	ID           int    `json:"id"`
	Name         string `json:"name"`
	Artist       string `json:"artists"`
	URL          string `json:"url"`
	DownloadLink string `json:"download_link"`
}

func (t *Track) String() string {
	return fmt.Sprintf("Track: {ID: %d, Name: %s, Artist: %s, URL: %s}", t.ID, t.Name, t.Artist, t.URL)
}

var (
	trackURLCache = make(map[int]string)
	cacheMutex    = &sync.RWMutex{}
)

func GetTrackUrl(trackID int) (string, error) {
	url := fmt.Sprintf("https://www.beatport.com/api/v4/catalog/tracks/%d", trackID)

	resp, err := http.Get(url)
	if err != nil {
		return "", fmt.Errorf("error getting track details: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to get track details: status code %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("error reading response body: %w", err)
	}

	var trackData map[string]interface{}
	err = json.Unmarshal(body, &trackData)
	if err != nil {
		return "", fmt.Errorf("error unmarshaling JSON: %w", err)
	}

	if _, ok := trackData["download_link"]; !ok {
		return "", fmt.Errorf("track with ID %d not found or download not available", trackID)
	}

	downloadLink, ok := trackData["download_link"].(string)
	if !ok {
		return "", fmt.Errorf("failed to get track download link: wrong format")
	}

	cacheMutex.Lock()
	trackURLCache[trackID] = downloadLink
	cacheMutex.Unlock()

	return downloadLink, nil
}

func DownloadTrack(track Track, destinationPath string) error {
	cacheMutex.RLock()
	downloadURL, found := trackURLCache[track.ID]
	cacheMutex.RUnlock()

	if !found {
		log.Printf("URL for track %d not found in cache, fetching...", track.ID)
	}
	downloadURL, err := GetTrackUrl(track.ID)
	if err != nil {
		return fmt.Errorf("error getting track url: %w", err)
	}

	resp, err := http.Get(downloadURL)
	if err != nil {
		return fmt.Errorf("error downloading track: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to download track: status code %d", resp.StatusCode)
	}

	filename := fmt.Sprintf("%s_%s_%s.mp3", strconv.Itoa(track.ID), track.Artist, track.Name)
	fullPath := filepath.Join(destinationPath, filename)

	out, err := os.Create(fullPath)
	if err != nil {
		return fmt.Errorf("error creating file: %w", err)
	}
	defer out.Close()

	_, err = io.Copy(out, resp.Body)
	if err != nil {
		return fmt.Errorf("error saving file: %w", err)
	}

	log.Printf("Track %s downloaded to %s", track.Name, fullPath)
	return nil
}