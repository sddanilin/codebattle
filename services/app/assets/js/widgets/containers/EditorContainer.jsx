import React, { useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useMachine } from '@xstate/react';
import cn from 'classnames';
import _ from 'lodash';

import editorModes from '../config/editorModes';
import editorSettingsByUserType from '../config/editorSettingsByUserType';
import editorUserTypes from '../config/editorUserTypes';
import { replayerMachineStates } from '../machines/game';

import * as GameActions from '../middlewares/Game';
import * as selectors from '../selectors';
import { actions } from '../slices';

import GameContext from './GameContext';
import EditorToolbar from './EditorsToolbars/EditorToolbar';
import GameResultIcon from '../components/GameResultIcon';

const useEditorMachine = (editorMachine, id) => {
  const dispatch = useDispatch();

  const context = { userId: id };

  const config = {
    actions: {
      userStartChecking: () => {
        dispatch(GameActions.checkGameResult());
      },
      handleTimeoutFailureChecking: () => {
        dispatch(actions.updateExecutionOutput({
          userId: id,
          status: 'timeout',
          output: '',
          result: {},
          asserts: [],
        }));

        dispatch(actions.updateCheckStatus({ [id]: false }));
      },
    },
  };

  const [editorCurrent, send, service] = useMachine(
    editorMachine.withConfig(config),
    {
      context,
      devTools: true,
      id: `editor_${id}`,
    },
  );

  useEffect(() => {
    GameActions.connectToEditor(service)(dispatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [editorCurrent, send, service];
};

const EditorContainer = ({
  id,
  editorMachine,
  type,
  cardClassName,
  theme,
  editorState,
  editorHeight,
  editorMode,
  children,
}) => {
  const dispatch = useDispatch();
  const updateEditorValue = data => dispatch(GameActions.sendEditorText(data));
  const players = useSelector(selectors.gamePlayersSelector);
  const { current: gameCurrent } = useContext(GameContext);

  const [editorCurrent, send] = useEditorMachine(editorMachine, id);

  const checkResult = () => {
    send('user_check_solution');
  };

  const isNeedHotKeys = type === 'current_user';

  useEffect(() => {
    /** @param {KeyboardEvent} e */
    const check = e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        checkResult();
      }
    };

    if (isNeedHotKeys) {
      window.addEventListener('keydown', check);

      return () => {
        window.removeEventListener('keydown', check);
      };
    }

    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userSettings = {
    type,
    ...editorCurrent.context,
    ...editorSettingsByUserType[type],
  };

  const actionBtnsProps = {
    checkResult,
    ...userSettings,
  };

  const toolbarParams = {
    player: players[id],
    editor: editorState,
    status: editorCurrent.value,
    actionBtnsProps,
    ...userSettings,
  };

  const canChange = userSettings.type === editorUserTypes.currentUser
    && !gameCurrent.matches({ replayer: replayerMachineStates.on });

  const editorParams = {
    syntax: editorState.currentLangSlug || 'javascript',
    onChange: canChange ? updateEditorValue : _.noop(),
    checkResult,
    value: editorState.text,
    editorHeight,
    mode: editorMode,
    theme,
    ...userSettings,
    editable:
      !gameCurrent.matches({ replayer: replayerMachineStates.on })
      && userSettings.editable,
  };

  const isWon = players[id].gameResult === 'won';

  const pannelBackground = cn('col-12 col-lg-6 p-1', {
    'bg-warning': editorCurrent.matches('checking'),
    'bg-winner':
      gameCurrent.matches({ game: 'game_over' })
      && editorCurrent.matches('idle')
      && isWon,
  });

  return (
    <div data-editor-state={editorCurrent.value} className={pannelBackground}>
      <div
        className={cardClassName}
        style={{ minHeight: '470px' }}
        data-guide-id="LeftEditor"
      >
        <EditorToolbar
          {...toolbarParams}
          toolbarClassNames="btn-toolbar justify-content-between align-items-center m-1"
          editorSettingClassNames="btn-group align-items-center m-1"
          userInfoClassNames="btn-group align-items-center justify-content-end m-1"
        />
        <div
          className="position-absolute cb-result-icon"
        >
          <GameResultIcon editor={editorState} />
        </div>
        {children({
          ...editorParams,
        })}
      </div>
    </div>
  );
};

export default EditorContainer;
