package beatport

import (
	"encoding/json"
	"fmt"
	"strconv"
)

type Key struct {
	Name          string    `json:"name"`
	Letter        string    `json:"letter"`
	ChordType     ChordType `json:"chord_type"`
	CamelotNumber int       `json:"camelot_number"`
	CamelotLetter string    `json:"camelot_letter"`
	IsFlat        bool      `json:"is_flat"`
	IsSharp       bool      `json:"is_sharp"`
}

type ChordType struct {
	Name string `json:"name"`
}

func (k *Key) Display(system string) string {
	switch system {
	case "standard":
		return k.Name
	case "standard-short":
		var symbol string
		if k.IsSharp {
			symbol = "#"
		} else if k.IsFlat {
			symbol = "b"
		}
		var chord string
		if k.ChordType.Name == "Minor" {
			chord = "m"
		}
		return k.Letter + symbol + chord
	case "openkey":
		var number int
		if k.CamelotNumber > 7 {
			number = k.CamelotNumber - 7
		} else {
			number = k.CamelotNumber + 5
		}
		var letter string
		if k.ChordType.Name == "Minor" {
			letter = "m"
		} else if k.ChordType.Name == "Major" {
			letter = "d"
		}
		return strconv.Itoa(number) + letter
	case "camelot":
		return strconv.Itoa(k.CamelotNumber) + k.CamelotLetter
	default:
		return ""
	}
}

func (b *Beatport) GetKeys(page int, params string) (*Paginated[Key], error) {
	res, err := b.fetch(
		"GET",
		fmt.Sprintf("/catalog/keys/?page=%d&%s", page, params),
		nil,
		"",
	)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	var response Paginated[Key]
	if err = json.NewDecoder(res.Body).Decode(&response); err != nil {
		return nil, err
	}
	return &response, nil
}

func (b *Beatport) GetKey(id int64) (*Key, error) {
	res, err := b.fetch(
		"GET",
		fmt.Sprintf("/catalog/keys/%d/", id),
		nil,
		"",
	)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	response := &Key{}
	if err = json.NewDecoder(res.Body).Decode(response); err != nil {
		return nil, err
	}
	return response, nil
}
