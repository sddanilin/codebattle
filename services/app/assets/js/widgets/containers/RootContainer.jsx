import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect, useSelector } from 'react-redux';
import Gon from 'gon';
import { useMachine } from '@xstate/react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import RootContainerAnimation from './RootContainerAnimation';
import GameWidget from './GameWidget';
import GameContext from './GameContext';
import InfoWidget from './InfoWidget';
import userTypes from '../config/userTypes';
import { actions } from '../slices';
import * as GameActions from '../middlewares/Game';
import * as ChatActions from '../middlewares/Chat';
import GameWidgetGuide from './GameWidgetGuide';
import WaitingOpponentInfo from '../components/WaitingOpponentInfo';
import CodebattlePlayer from './CodebattlePlayer';
import FeedBackWidget from '../components/FeedBackWidget';
import GamePreview from '../components/Game/GamePreview';
import { replayerMachineStates } from '../machines/game';
import AnimationModal from '../components/AnimationModal';
import NetworkAlert from './NetworkAlert';
import sound from '../lib/sound';

const currentUser = Gon.getAsset('current_user');

const RootContainer = ({
  connectToGame,
  connectToChat,
  setCurrentUser,
  gameMachine,
  editorMachine,
  toggleMuteSound,
}) => {
  const [modalShowing, setModalShowing] = useState(false);
  const mute = useSelector(state => state.userSettings.mute);
  const [current, send, service] = useMachine(gameMachine, {
    devTools: true,
    actions: {
      showGameResultModal: () => {
        setModalShowing(true);
      },
    },
  });

  useEffect(() => {
    // FIXME: maybe take from gon?
    setCurrentUser({ user: { ...currentUser, type: userTypes.spectator } });
    connectToGame(service);
    connectToChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const muteSound = e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        // eslint-disable-next-line no-unused-expressions
        mute ? sound.toggle() : sound.toggle(0);
        toggleMuteSound();
      }
    };

    window.addEventListener('keydown', muteSound);

    return () => {
      window.removeEventListener('keydown', muteSound);
    };
  }, [mute, toggleMuteSound]);

  if (current.matches({ game: 'waiting' })) {
    const gameUrl = window.location.href;
    return <WaitingOpponentInfo gameUrl={gameUrl} />;
  }

  const isRenderPreview = current.matches({ game: 'preview' });

  return (
    <RootContainerAnimation
      isRenderPreview={isRenderPreview}
    >
      {isRenderPreview ? <GamePreview className="animate" /> : (
        <GameContext.Provider value={{ current, send, service }}>
          <div className="x-outline-none">
            <GameWidgetGuide />
            <NetworkAlert />
            <div className="container-fluid">
              <div className="row no-gutter cb-game">
                <AnimationModal setModalShowing={setModalShowing} modalShowing={modalShowing} />
                <InfoWidget />
                <GameWidget editorMachine={editorMachine} />
                {mute && (
                  <div className="rounded p-2 bg-dark cb-mute-icon">
                    <FontAwesomeIcon size="lg" color="white" icon={['fas', 'volume-mute']} />
                  </div>
                )}
                <FeedBackWidget />
              </div>
            </div>
            {current.matches({ replayer: replayerMachineStates.on }) && (
              <CodebattlePlayer />
            )}
          </div>
        </GameContext.Provider>
      )}
    </RootContainerAnimation>
  );
};

RootContainer.propTypes = {
  setCurrentUser: PropTypes.func.isRequired,
  connectToGame: PropTypes.func.isRequired,
};

const mapDispatchToProps = {
  setCurrentUser: actions.setCurrentUser,
  connectToGame: GameActions.connectToGame,
  connectToChat: ChatActions.connectToChat,
  toggleMuteSound: actions.toggleMuteSound,
};

export default connect(null, mapDispatchToProps)(RootContainer);
