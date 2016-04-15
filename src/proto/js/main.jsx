const HomeView = React.createClass({
    render: function () {
        return <p>Home</p>;
    }
});

const AboutView = React.createClass({
    render: function () {
        return <p>About</p>;
    }
});

const App = React.createClass({
    getInitialState: function () {
        return {
            route: window.location.hash.substr(1)
        }
    },
    componentDidMount: function () {
        window.addEventListener('hashchange', () => {
            this.setState({
                route: window.location.hash.substr(1)
            })
        })
    },
    render: function () {
        if (this.state.route == 'about') {
            return <AboutView/>;
        }

        return <HomeView/>;
    }
});

$(function () {
    window.app = ReactDOM.render(<App/>, $('#main').get(0));
});
