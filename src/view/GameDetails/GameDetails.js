import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router';
import { withRouter } from 'react-router-dom';

import gameApi from 'services/GameApi';
import pageNames from 'lib/pageNames';
import { onGameLeft } from 'services/SocketClient';
import { TeamSelector, Spinner } from 'components';
import { setCurrentPage, setGame, isPageLoading } from 'actions/navigation';
import './GameDetails.scss';
import { Scoreboard } from 'components';
import TeamPlayer from '../../components/TeamSelector/TeamPlayer';
import uuid from 'uuid';

const mapDispatchToProps = dispatch => ({
  setCurrentPage: () => dispatch(setCurrentPage(pageNames.gameDetails)),
  isPageLoading: (isLoading) => dispatch(isPageLoading(isLoading)),
  setGame: (game) => dispatch(setGame(game)),
});

const mapStateToProps = state => ({
  countries: state.countries,
  user: state.user,
});

class GameDetails extends PureComponent {
  state = {
    gameId: null,
    isBusy: false,
    isGameStarted: false,
    isGameCompleted: false,
    game: null,
  };
  
  async componentDidMount() {
    const { setCurrentPage } = this.props;
    const { params } = this.props.match;

    setCurrentPage();
    this.setState({ gameId: params.gameId });
    await this.getGame(params.gameId);
  }

  getGame = async (gameId) => {
    const { isBusy } = this.state;
    if (isBusy) {
      return;
    }

    this.setState({ isBusy: true });

    try {
      const game = await gameApi.getGame(gameId);

      if (game) {
        switch (game.status) {
          case 'INPROGRESS':
          case 'PAUSED':
            this.setState({ isGameStarted: true });
            break;
          case 'COMPLETED':
            this.setState({ isGameCompleted: true });
            break;
          default:
            break;
        }
        
        this.props.setGame(game);
        this.setState({ game, isBusy: false }, this.isGameReady);
      }
    } catch (error) {
      this.setState({ isBusy: false });
      console.log(error);
    }
  };

  getMockedAvatarData(){
    return {
        username: "johnny_bravo",
        avatarId: 1,
        playerId: 1,
        profilePicture: "../../assets/mark_bennett.png",
        name: "Mark Bennett",
    }
  }

  render() {
    return (
      <div className="gamedetails-view">
        <div className="gamedetails-view__header">
          <h2>Game 2</h2>
          <p>england vs scotland</p>
          <p>Round 1 of 5</p>
        </div>
        <Scoreboard/>
        <p className="teamBallPosession">Defense Team (Scotland)</p>
        <p className="teamMissionDescription">Guess 1 player you think is the ball bearer
           if majority of the team guesses the right person your team wins the round.</p>
        <TeamPlayer key={uuid()} currentUser="Kim" username="johnny_bravo" avatar={this.getMockedAvatarData()} teamId={1}/>
      </div>
    )
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(GameDetails));
export { GameDetails as PlainGameDetails };