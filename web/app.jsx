"use strict";

var BeerBox = React.createClass({
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    this.handleFilterSubmit();
  },
  handleFilterSubmit: function(filter){
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      data: filter,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  render: function() {
    return (
      <div className="beerBox">
        <h1>Beer</h1>
        <BeerFilter onFilterSubmit={this.handleFilterSubmit}/>
        <BeerList data={this.state.data}/>
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

ReactDOM.render(
  <BeerBox url="/api/beer" />,
  document.getElementById('content')
);
