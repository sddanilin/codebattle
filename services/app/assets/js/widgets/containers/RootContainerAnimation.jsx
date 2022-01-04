import React from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';

const RootContainerAnimation = ({ isRenderPreview, children }) => (
  <SwitchTransition mode="out-in">
    <CSSTransition
      key={isRenderPreview ? 'preview' : 'game'}
      addEndListener={(node, done) => {
        node.addEventListener('transitionend', done, false);
      }}
      classNames="preview"
    >
      {children}
    </CSSTransition>
  </SwitchTransition>
);

export default RootContainerAnimation;
