"use strict";

var BeerBox = React.createClass({
  getInitialState: function() {
    return {data: [], pageInfo: {count: 0, page: 0, pages: 0}, filter: {}};
  },
  componentDidMount: function() {
    this.handleFilterSubmit();
  },
  handleFilterSubmit: function(filter, page){
    if(!filter) filter = {}
    if(!page) page = 1

    $.ajax({
      url: this.props.beerCountUrl,
      dataType: 'json',
      cache: false,
      data: filter,
      success: function(countData) {

        var pages = Math.floor(((countData.count - 1) / 5) + 1);

        filter.limit = 5
        filter.offset = (page * 5) - 5

        $.ajax({
          url: this.props.beerUrl,
          dataType: 'json',
          cache: false,
          data: filter,
          success: function(data) {
            this.setState({
              data: data,
              pageInfo: {count: countData.count, page: page, pages: pages},
              filter: filter
            });
          }.bind(this),
          error: function(xhr, status, err) {
            console.error(this.props.beerUrl, status, err.toString());
          }.bind(this)
        });

      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.beerCountUrl, status, err.toString());
      }.bind(this)
    });


  },
  render: function() {
    return (
      <div className="beerBox">
        <h1>Beer</h1>
        <BeerFilter onFilterSubmit={this.handleFilterSubmit}/>
        <BeerPaging pageInfo={this.state.pageInfo} onFilterSubmit={this.handleFilterSubmit} filter={this.state.filter}/>
        <BeerList data={this.state.data} pageInfo={this.state.pageInfo}/>
      </div>
    );
  }
});

var BeerFilter = React.createClass({
  getInitialState: function(){
    return {name: ''};
  },
  handleNameChange: function(e){
    this.setState({name: e.target.value});
  },
  handleSubmit: function(e){
    e.preventDefault();

    this.props.onFilterSubmit({
      name: this.state.name.trim()
    });
  },
  render: function() {
    return (
      <form
        className="beerFilterForm"
        onSubmit={this.handleSubmit}>
        <input
          type="text"
          placeholder="Beer Name"
          value={this.state.name}
          onChange={this.handleNameChange} />
        <input type="submit" />
      </form>
    );
  }
});

var BeerList = React.createClass({
  render: function() {
    if(!this.props.data) return (
      <div>No Results</div>
    );
    var beersInfo = this.props.data.map(function(beer) {
      return (
        <BeerInfo name={beer.name} style={beer.style} key={beer.id}>
          {beer.description}
        </BeerInfo>
      );
    });
    return (
      <div className="beerList">
        {beersInfo}
      </div>
    );
  }
});

var BeerInfo = React.createClass({
  rawMarkup: function() {
      var md = new Remarkable();
      var rawMarkup = md.render(this.props.children.toString());
      return { __html: rawMarkup };
    },

  render: function() {
    var md = new Remarkable();
    return (
      <div className="beerInfo">
        <h2 className="BeerInfoHeader">
          {this.props.name}
        </h2>
        <h4>
          {this.props.style}
        </h4>
        <span dangerouslySetInnerHTML={this.rawMarkup()} />
      </div>
    );
  }
});

var BeerPaging = React.createClass({
  handleSubmitPrev: function(e){
    e.preventDefault();

    this.props.onFilterSubmit(this.props.filter, this.props.pageInfo.page - 1);
  },
  handleSubmitNext: function(e){
    e.preventDefault();

    this.props.onFilterSubmit(this.props.filter, this.props.pageInfo.page + 1);
  },
  render: function(){
    var next = this.props.pageInfo.page < this.props.pageInfo.pages ? (<button onClick={this.handleSubmitNext}>Next</button>) : "";
    var prev = this.props.pageInfo.page > 1 ? (<button onClick={this.handleSubmitPrev}>Prev</button>) : "";

    return (
      <div>
        <div>{prev} {this.props.pageInfo.page} {next}</div>
        <div>Page {this.props.pageInfo.page} of {this.props.pageInfo.pages}</div>
        <div>Total beers {this.props.pageInfo.count}</div>
      </div>
    )
  }
});

ReactDOM.render(
  <BeerBox beerUrl="/api/beer" beerCountUrl="/api/beer/count" />,
  document.getElementById('content')
);
