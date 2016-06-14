"use strict";

var BeerBox = React.createClass({
  getInitialState: function() {
    return {data: [], pageInfo: {count: 0, page: 0, pages: 0, pageSize: 10}, filter: {}};
  },
  componentDidMount: function() {
    this.handleFilterSubmit();
  },
  handleCreate: function(newBeer){
    $.ajax({
      url: this.props.beerUrl,
      dataType: 'json',
      contentType: 'application/json',
      cache: false,
      method: "POST",
      data: JSON.stringify(newBeer),
      success: function(data) {
        this.handleFilterSubmit(this.state.filter, this.state.pageInfo.page);
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.beerUrl, status, err.toString());
      }.bind(this)
    });
  },
  handleRemove: function(id) {
    $.ajax({
      url: this.props.beerUrl + "/" + id,
      dataType: 'json',
      cache: false,
      method: "DELETE",
      success: function(data) {
        this.handleFilterSubmit(this.state.filter, this.state.pageInfo.page);
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.beerUrl, status, err.toString());
      }.bind(this)
    });
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

        var pageSize = this.state.pageInfo.pageSize;
        var pages = Math.floor(((countData.count - 1) / pageSize) + 1);

        filter.limit = pageSize;
        filter.offset = (page * pageSize) - pageSize;

        $.ajax({
          url: this.props.beerUrl,
          dataType: 'json',
          cache: false,
          data: filter,
          success: function(data) {
            this.setState({
              data: data,
              pageInfo: {count: countData.count, page: page, pages: pages, pageSize: pageSize},
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
      <div className="beerBox container-fluid">
        <h3>Beer Search</h3>
        <BeerFilter onFilterSubmit={this.handleFilterSubmit}/>
        <BeerPaging pageInfo={this.state.pageInfo} onFilterSubmit={this.handleFilterSubmit} filter={this.state.filter}/>
        <hr/>
        <BeerList data={this.state.data} pageInfo={this.state.pageInfo} onRemove={this.handleRemove}/>
        <NewBeerModal onCreate={this.handleCreate}></NewBeerModal>
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
  handleNewBeer: function(e){
    $('#newBeerModal').modal('show');
  },
  render: function() {
    return (
      <form
        className="beerFilterForm form-inline"
        onSubmit={this.handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            placeholder="Beer Name"
            value={this.state.name}
            onChange={this.handleNameChange}
            className="form-control input-sm"/>
        </div>
        <button type="submit" className="btn btn-default btn-sm"><span className="glyphicon glyphicon-search" aria-hidden="true"></span> Filter</button>
        <button type="button" onClick={this.handleNewBeer} className="btn btn-default btn-sm pull-right"><span className="glyphicon glyphicon-plus" aria-hidden="true"></span> New Beer</button>
      </form>
    );
  }
});

var BeerList = React.createClass({
  render: function() {
    if(!this.props.data) return (
      <div>No Results</div>
    );
    var removeHandler = this.props.onRemove;
    var beersInfo = this.props.data.map(function(beer) {
      return (
        <BeerInfo beer={beer}  key={beer.id} onRemove={removeHandler}>
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
  handleRemove: function(e){
    this.props.onRemove(this.props.beer.id);
  },
  render: function() {
    var md = new Remarkable();
    return (
      <div className="beerInfo panel panel-default">
        <div className="panel-heading">
          <h5 className="BeerInfoHeader">
            {this.props.beer.name}
            <button type="button" onClick={this.handleRemove} className="btn btn-default btn-sm pull-right"><span className="glyphicon glyphicon-remove" aria-hidden="true"></span></button>
          </h5>
        </div>
        <div className="panel-body">
          <h5>
            <span className="label label-default">{this.props.beer.style} {this.props.beer.abv}%</span>
          </h5>
          <i>
           <span dangerouslySetInnerHTML={this.rawMarkup()} />
          </i>
        </div>
      </div>
    );
  }
});

var NewBeerModal = React.createClass({
  render: function(){
    return (
      <div className="modal fade" tabindex="-1" role="dialog" id="newBeerModal">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
              <h4 className="modal-title">New Beer</h4>
            </div>
            <div className="modal-body">
              <NewBeerForm onSave={this.props.onCreate}></NewBeerForm>
            </div>
          </div>
        </div>
      </div>
    )
  }
});

var NewBeerForm = React.createClass({
  getInitialState: function(){
    return {name: '', style: '', abv: 0, description: '', brewery_id: ''}
  },
  handleNameChange: function(e){
    this.setState({name: e.target.value})
  },
  handleStyleChange:  function(e){
    this.setState({style: e.target.value})
  },
  handleAbvChange:  function(e){
    this.setState({abv: Number(e.target.value)})
  },
  handleDescriptionChange:  function(e){
    this.setState({description: e.target.value})
  },
  handleBreweryChange:  function(e){
    this.setState({brewery_id: e.target.value})
  },
  handleSave: function(e){
    this.props.onSave(this.state);
  },
  render: function(){
    return (
      <form>
        <div className="form-group">
          <label>Name</label>
          <input type="text" value={this.state.name} onChange={this.handleNameChange} className="form-control" placeholder="Name"/>
        </div>
        <div className="form-group">
          <label>Brewery</label>
          <input type="text" value={this.state.brewery_id} onChange={this.handleBreweryChange} className="form-control" placeholder="Brewery"/>
        </div>
        <div className="form-group">
          <label>Style</label>
          <input type="text" value={this.state.style} onChange={this.handleStyleChange} className="form-control" placeholder="Style"/>
        </div>
        <div className="form-group">
          <label>Abv</label>
          <input type="number" value={this.state.abv} onChange={this.handleAbvChange} className="form-control" placeholder="Abv"/>
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea onChange={this.handleDescriptionChange} className="form-control" rows="5"></textarea>
        </div>
        <button type="button" value={this.state.description} onClick={this.handleSave} className="btn btn-primary">Save</button>
      </form>
    )
  }
});

var BeerPaging = React.createClass({
  handleSubmitPrev: function(e){
    e.preventDefault();

    this.props.onFilterSubmit(this.props.filter, this.props.pageInfo.page - 1);
  },
  handleSubmitFirst: function(e){
    e.preventDefault();

    this.props.onFilterSubmit(this.props.filter, 1);
  },
  handleSubmitLast: function(e){
    e.preventDefault();

    this.props.onFilterSubmit(this.props.filter, this.props.pageInfo.pages);
  },
  handleSubmitNext: function(e){
    e.preventDefault();

    this.props.onFilterSubmit(this.props.filter, this.props.pageInfo.page + 1);
  },
  render: function(){
    var next = this.props.pageInfo.page < this.props.pageInfo.pages ? (<button className="btn btn-default" onClick={this.handleSubmitNext}>Next</button>) : "";
    var prev = this.props.pageInfo.page > 1 ? (<button className="btn btn-default" onClick={this.handleSubmitPrev}>Prev</button>) : "";
    var first = this.props.pageInfo.page > 1 ? (<button className="btn btn-default" onClick={this.handleSubmitFirst}>First</button>) : "";
    var last = this.props.pageInfo.page < this.props.pageInfo.pages ? (<button className="btn btn-default" onClick={this.handleSubmitLast}>Last</button>) : "";

    return (
      <div>
        <div>{this.props.pageInfo.pageSize} beers of {this.props.pageInfo.count} total in {this.props.pageInfo.pages} pages</div>
          <div className="btn-group btn-group-sm" role="group">
            {first}{prev}
            <button className="btn btn-default">{this.props.pageInfo.page}</button>
            {next}{last}
          </div>
      </div>
    )
  }
});

ReactDOM.render(
  <BeerBox beerUrl="/api/beer" beerCountUrl="/api/beer/count" />,
  document.getElementById('content')
);
