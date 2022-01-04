import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import { Tooltip, OverlayTrigger } from 'react-bootstrap';
import _ from 'lodash';

import * as selectors from '../selectors';

const GameResultIcon = ({ editor: { userId } }) => {
  const players = useSelector(selectors.gamePlayersSelector);

  const { id: opponentId } = _.find(players, ({ id }) => id !== userId);

  const resultUser1 = _.get(players, [userId, 'gameResult']);
  const resultUser2 = _.get(players, [opponentId, 'gameResult']);

  const tooltipId = `tooltip-${resultUser1}`;

  if (resultUser1 === 'gave_up') {
    return (
      <OverlayTrigger
        overlay={<Tooltip id={tooltipId}>Player gave up</Tooltip>}
        placement="left"
      >
        <img
          className="cb-result-toolbar-icon"
          src="/assets/images/big-flag.png"
          alt="white-flag"
        />
      </OverlayTrigger>
    );
  }

  if (resultUser1 === 'won' && resultUser2 !== 'gave_up') {
    return (
      <OverlayTrigger
        overlay={<Tooltip id={tooltipId}>Player won</Tooltip>}
        placement="left"
      >
        <img src="/assets/images/big-gold-cup.png" alt="gold-cup" />
      </OverlayTrigger>
    );
  }

  return null;
};

export default memo(GameResultIcon);
