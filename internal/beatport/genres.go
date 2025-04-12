package beatport

import (
	"encoding/json"
	"fmt"
)

type Genre struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

func (b *Beatport) GetGenres(page int, params string) (*Paginated[Genre], error) {
	res, err := b.fetch(
		"GET",
		fmt.Sprintf("/catalog/genres/?page=%d&%s", page, params),
		nil,
		"",
	)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	var response Paginated[Genre]
	if err = json.NewDecoder(res.Body).Decode(&response); err != nil {
		return nil, err
	}
	return &response, nil
}

func (b *Beatport) GetSubgenres(genreId int64, page int, params string) (*Paginated[Genre], error) {
	res, err := b.fetch(
		"GET",
		fmt.Sprintf("/catalog/genres/%d/subgenres/?page=%d&%s", genreId, page, params),
		nil,
		"",
	)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	var response Paginated[Genre]
	if err = json.NewDecoder(res.Body).Decode(&response); err != nil {
		return nil, err
	}
	return &response, nil
}

func (b *Beatport) GetGenre(id int64) (*Genre, error) {
	return b.getGenre(id, "/catalog/genres/%d/")
}
