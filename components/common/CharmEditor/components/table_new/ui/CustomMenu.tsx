// @flow

import React from 'react';

import './czi-custom-menu.css';
import './czi-custom-scrollbar.css';

class CustomMenu extends React.PureComponent<{ children: React.ReactNode }> {
  render() {
    const { children } = this.props;
    return <div className='czi-custom-menu czi-custom-scrollbar'>{children}</div>;
  }
}

export default CustomMenu;
