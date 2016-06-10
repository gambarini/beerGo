package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/julienschmidt/httprouter"
	"gopkg.in/couchbase/gocb.v1"
)

//GetBeer ok
func GetBeer(w http.ResponseWriter, r *http.Request, p httprouter.Params) {

	limit, offset := GetLimitAndOffset(r.URL.Query().Get("limit"), r.URL.Query().Get("offset"))
	nameQuery := GetNameQuery(r.URL.Query().Get("name"))

	json, err := QueryBeerSample("beer", nameQuery, limit, offset)

	HandleResponse(json, err, w)

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

// ExecuteQuery ok
func ExecuteQuery(query string) ([]byte, error) {
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

// QueryBeerSample ok
func QueryBeerSample(sampleType, nameQuery string, limit, offset int) ([]byte, error) {

	query := fmt.Sprintf("SELECT b.*, meta(b).id as id FROM `beer-sample` b where b.type='%s' %s order by b.name limit %d offset %d", sampleType, nameQuery, limit, offset)
	return ExecuteQuery(query)
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
	r.GET("/api/brewery", GetBrewery)
	r.GET("/api/beer/count", CountBeer)
	r.GET("/api/brewery/count", CountBrewery)

	r.ServeFiles("/web/*filepath", http.Dir("web"))

	http.ListenAndServe("localhost:9000", r)
}
