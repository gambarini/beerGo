package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/julienschmidt/httprouter"
	"gopkg.in/couchbase/gocb.v1"
)

//Beer ok
type Beer struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Style       string  `json:"style"`
	Abv         float32 `json:"abv"`
	BreweryID   string  `json:"brewery_id"`
	Type        string  `json:"type"`
}

//GetBeer ok
func GetBeer(w http.ResponseWriter, r *http.Request, p httprouter.Params) {

	limit, offset := GetLimitAndOffset(r.URL.Query().Get("limit"), r.URL.Query().Get("offset"))
	nameQuery := GetNameQuery(r.URL.Query().Get("name"))

	json, err := QueryBeerSample("beer", nameQuery, limit, offset)

	HandleResponse(json, err, w)

}

//CreateBeer ok
func CreateBeer(w http.ResponseWriter, r *http.Request, p httprouter.Params) {

	dec := json.NewDecoder(r.Body)

	var beer Beer
	err := dec.Decode(&beer)

	if err != nil {
		w.WriteHeader(500)
		fmt.Fprintf(w, "%s", err)
		return
	}

	id := strings.Replace((beer.BreweryID + "-" + beer.Name), " ", "_", -1)
	beer.Type = "beer"

	bucket.Insert(id, &beer, 0)

	json, _ := json.Marshal(beer)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(201)

	fmt.Fprintf(w, "%s", json)

}

//RemoveBeer ok
func RemoveBeer(w http.ResponseWriter, r *http.Request, p httprouter.Params) {

	id := p.ByName("id")
	var beer *Beer

	cas, _ := bucket.Get(id, &beer)

	if beer == nil {
		w.WriteHeader(404)
		return
	}

	_, err := bucket.Remove(id, cas)

	if err != nil {
		w.WriteHeader(500)
		fmt.Fprintf(w, "%s", err)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(204)

}

//EditBeer ok
func EditBeer(w http.ResponseWriter, r *http.Request, p httprouter.Params) {

	id := p.ByName("id")
	var beer *Beer

	cas, _ := bucket.Get(id, &beer)

	if beer == nil {
		w.WriteHeader(404)
		return
	}

	dec := json.NewDecoder(r.Body)

	err := dec.Decode(&beer)

	if err != nil {
		w.WriteHeader(500)
		fmt.Fprintf(w, "%s", err)
	}

	bucket.Replace(id, &beer, cas, 0)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(200)

	json, _ := json.Marshal(beer)

	fmt.Fprintf(w, "%s", json)
}

//CountBeer ok
func CountBeer(w http.ResponseWriter, r *http.Request, p httprouter.Params) {

	nameQuery := GetNameQuery(r.URL.Query().Get("name"))

	json, err := CountBeerSample("beer", nameQuery)

	HandleResponse(json, err, w)

}

//GetBrewery ok
func GetBrewery(w http.ResponseWriter, r *http.Request, p httprouter.Params) {

	limit, offset := GetLimitAndOffset(r.URL.Query().Get("limit"), r.URL.Query().Get("offset"))
	nameQuery := GetNameQuery(r.URL.Query().Get("name"))

	json, err := QueryBeerSample("brewery", nameQuery, limit, offset)

	HandleResponse(json, err, w)

}

//CountBrewery ok
func CountBrewery(w http.ResponseWriter, r *http.Request, p httprouter.Params) {

	nameQuery := GetNameQuery(r.URL.Query().Get("name"))

	json, err := CountBeerSample("brewery", nameQuery)

	HandleResponse(json, err, w)

}

//Test ok
func Test(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	fmt.Fprint(w, "OK!")
}

// HandleResponse ok
func HandleResponse(json []byte, err error, w http.ResponseWriter) {
	if err != nil {
		w.WriteHeader(500)
		fmt.Fprintf(w, "%s", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(200)

	fmt.Fprintf(w, "%s", json)
}

// GetNameQuery ok
func GetNameQuery(name string) string {
	if name == "" {
		return ""
	}
	return fmt.Sprintf(" and b.name like '%s' ", name+"%")
}

// GetLimitAndOffset ok
func GetLimitAndOffset(strLimit, strOffset string) (int, int) {
	var limit, offset int
	var errLimit, errOffset error

	if limit, errLimit = strconv.Atoi(strLimit); errLimit != nil {
		limit = 10
	}

	if offset, errOffset = strconv.Atoi(strOffset); errOffset != nil {
		offset = 0
	}

	return limit, offset
}

// ExecuteQueryToArray ok
func ExecuteQueryToArray(query string) ([]byte, error) {
	n1qlQuery := gocb.NewN1qlQuery(query)
	rows, err := bucket.ExecuteN1qlQuery(n1qlQuery, nil)

	if err != nil {
		return nil, err
	}

	var retValues []interface{}
	var row interface{}

	for rows.Next(&row) {
		retValues = append(retValues, row)
	}

	return json.Marshal(retValues)
}

// ExecuteQuery ok
func ExecuteQuery(query string) ([]byte, error) {
	n1qlQuery := gocb.NewN1qlQuery(query)
	rows, err := bucket.ExecuteN1qlQuery(n1qlQuery, nil)

	if err != nil {
		return nil, err
	}

	var row interface{}

	rows.Next(&row)

	return json.Marshal(row)
}

// QueryBeerSample ok
func QueryBeerSample(sampleType, nameQuery string, limit, offset int) ([]byte, error) {

	query := fmt.Sprintf("SELECT b.*, meta(b).id as id FROM `beer-sample` b where b.type='%s' %s order by b.name limit %d offset %d", sampleType, nameQuery, limit, offset)
	return ExecuteQueryToArray(query)
}

// CountBeerSample ok
func CountBeerSample(sampleType, nameQuery string) ([]byte, error) {

	query := fmt.Sprintf("SELECT count(b) as count FROM `beer-sample` b where b.type='%s' %s", sampleType, nameQuery)
	return ExecuteQuery(query)
}

var bucket *gocb.Bucket

func main() {
	// Connect to Cluster
	cluster, err := gocb.Connect("couchbase://127.0.0.1")
	if err != nil {
		fmt.Println("ERRROR CONNECTING TO CLUSTER:", err)
	}
	// Open Bucket
	bucket, err = cluster.OpenBucket("beer-sample", "")
	if err != nil {
		fmt.Println("ERRROR OPENING BUCKET:", err)
	}

	r := httprouter.New()

	r.GET("/api/beer", GetBeer)
	r.POST("/api/beer", CreateBeer)
	r.PUT("/api/beer/:id", EditBeer)
	r.DELETE("/api/beer/:id", RemoveBeer)
	r.GET("/api/brewery", GetBrewery)
	r.GET("/api/beer/count", CountBeer)
	r.GET("/api/brewery/count", CountBrewery)

	r.ServeFiles("/web/*filepath", http.Dir("web"))

	http.ListenAndServe("localhost:9000", r)
}
