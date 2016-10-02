var Comment = React.createClass({
  rawMarkup: function() {
    var md = new Remarkable();
    var rawMarkup = md.render(this.props.children.toString());
    return { __html: rawMarkup };
  },

  componentDidMount: function() {

    var time="0ms"
    if(this.props.type == "question"){
      time="2000ms"
    }
    // Get the components DOM node
    var elem = ReactDOM.findDOMNode(this);
    // Set the opacity of the element to 0
    elem.style.opacity = 0;
    window.requestAnimationFrame(function() {
        // Now set a transition on the opacity
        elem.style.transition = "opacity "+time;
        // and set the opacity to 1
        elem.style.opacity = 1;
    });
},

  render: function() {
    var sideColor = '#ffffff';
    var className = 'well';
    if(this.props.type == "question"){
      sideColor = '#d5eef6';
      className = 'well';
    }
    var wellStyle = {
      width: '100%',
      wordWrap: 'break-word',
      padding: '5px',
      minHeight: '5px',
      marginBottom: '15px',
      backgroundColor: sideColor,
      fontSize: '20px'
    };
    return (
      <div className={className} style={wellStyle} dangerouslySetInnerHTML={this.rawMarkup()}>
      </div>
    );
  }
});

var CommentBox = React.createClass({
  loadCommentsFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  handleCommentSubmit: function(comment) {
    var comments = this.state.data;
    // Optimistically set an id on the new comment. It will be replaced by an
    // id generated by the server. In a production application you would likely
    // not use Date.now() for this and would have a more robust system in place.
    comment.id = Date.now();
    var newComments = comments.concat([comment]);
    this.setState({data: newComments});
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: comment,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        this.setState({data: comments});
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    this.loadCommentsFromServer();
    setInterval(this.loadCommentsFromServer, this.props.pollInterval);
  },
  render: function() {
    var panelStyle = {
      // position: "fixed"
    }
    return (
      <div className="container">
        <div className="panel panel-default" style={panelStyle}>
          <CommentList data={this.state.data} />
        </div>
        <CommentForm onCommentSubmit={this.handleCommentSubmit} />
      </div>
    );
  }
});

var CommentList = React.createClass({

  componentWillUpdate: function() {
  var node = ReactDOM.findDOMNode(this);
  this.shouldScrollBottom = node.scrollTop + node.offsetHeight === node.scrollHeight;
},

componentDidUpdate: function() {
  if (this.shouldScrollBottom) {
    var node = ReactDOM.findDOMNode(this);
    node.scrollTop = node.scrollHeight
  }
},

  render: function() {
    var commentNodes = this.props.data.map(function(comment) {
      return (
        <Comment type={comment.type}>
          {comment.text}
        </Comment>
      );
    });
    var divStyle = {
      // minHeight: '80%',
      // maxHeight: '80%',
      minHeight: '400px',
      maxHeight: '400px',
      overflowY: "auto"
    };
    return (
        <div className="panel-body" style={divStyle}>
          {commentNodes}
        </div>
    );
  }
});

var CommentForm = React.createClass({
  getInitialState: function() {
    return {text: ''};
  },
  handleTextChange: function(e) {
    this.setState({text: e.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    var text = this.state.text.trim();
    if (!text) {
      return;
    }
    this.props.onCommentSubmit({text: text});
    this.setState({text: ''});
  },
  componentDidMount: function(){
    this.refs.messagearea.focus();
  },
  render: function() {
    return (
      <form className="input-group" onSubmit={this.handleSubmit}>
        <input
          type="text"
          className="form-control"
          ref="messagearea"
          placeholder="Say something..."
          value={this.state.text}
          onChange={this.handleTextChange}
        />
        <span className="input-group-btn">
          <input type="submit" value="Reply" className="btn btn-default" />
        </span>
      </form>
    );
  }
});

ReactDOM.render(
  <CommentBox url="/api/comments" pollInterval={2000} />,
  document.getElementById('content')
);
