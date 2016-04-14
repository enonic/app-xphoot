// Namespace for our app
var app = {};

// Countdown timer
app.countdownTimer = React.createClass({
    getInitialState: function () {
        return {elapsed: 0};
    },
    tick: function () {
        this.setState({elapsed: new Date() - this.props.start});
    },
    componentDidMount: function () {
        this.timer = setInterval(this.tick, 50);
    },
    componentWillUnmount: function () {
        clearInterval(this.timer);
    },
    render: function () {
        var elapsed = Math.round(this.state.elapsed / 100);
        var seconds = (elapsed / 10).toFixed(1);
        return <p>Started <b>{seconds} seconds</b> ago.</p>;
    }
});

ReactDOM.render(<app.countdownTimer start={Date.now()}/>, $('#main').get(0));
