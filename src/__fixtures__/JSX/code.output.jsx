import React from 'react';
import PropTypes from 'prop-types';
import Button from '../Button';
import Icon from '../Icon';
import './Banner.scss';

const Banner = props => {
  return /*#__PURE__*/React.createElement("div", {
    style: { ...(props.tint ? {
        '--tint-1': 'var(--' + props.tint + '-1)',
        '--tint-2': 'var(--' + props.tint + '-2)',
        '--tint-3': 'var(--' + props.tint + '-3)',
        '--tint-4': 'var(--' + props.tint + '-4)',
        '--tint-5': 'var(--' + props.tint + '-5)',
        '--tint-6': 'var(--' + props.tint + '-6)',
        '--tint-7': 'var(--' + props.tint + '-7)',
        '--tint-8': 'var(--' + props.tint + '-8)',
        '--tint-9': 'var(--' + props.tint + '-9)',
        '--tint-10': 'var(--' + props.tint + '-10)',
        '--tint-11': 'var(--' + props.tint + '-11)',
        '--tint-12': 'var(--' + props.tint + '-12)'
      } : {}),
      ...(props.style || {})
    },
    className: `anima-ds-banner ${props.closable ? 'closable' : ''}`
  }, /*#__PURE__*/React.createElement("header", null, /*#__PURE__*/React.createElement("span", {
    "is-anima": "true",
    "data-name": "Icon",
    "data-package": "src/__fixtures__/Icon"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: props.icon,
    color: 'var(--tint-9)',
    size: "md"
  })), /*#__PURE__*/React.createElement("span", null, props.title), props.closable && /*#__PURE__*/React.createElement("span", {
    "is-anima": "true",
    "data-name": "Button",
    "data-package": "src/__fixtures__/Button"
  }, /*#__PURE__*/React.createElement(Button, {
    icon: "close",
    tint: props.tint,
    variant: "tertiary",
    border: false,
    size: "sm",
    onClick: props.onClose
  }))), /*#__PURE__*/React.createElement("div", {
    className: "anima-ds-banner_content"
  }, props.message), props.hasActions ? /*#__PURE__*/React.createElement("footer", null, props.actions.map((item, index) => {
    return /*#__PURE__*/React.createElement("span", {
      "is-anima": "true",
      "data-name": "Button",
      "data-package": "src/__fixtures__/Button"
    }, /*#__PURE__*/React.createElement(Button, {
      onClick: item.action,
      variant: "tertiary",
      tint: props.tint,
      label: item.label,
      fullWidth: true,
      key: index
    }));
  })) : '');
};

Banner.propTypes = {
  actions: PropTypes.array,
  closable: PropTypes.bool,
  hasActions: PropTypes.bool,
  icon: PropTypes.string,
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  onClose: PropTypes.func,
  style: PropTypes.object,
  tint: PropTypes.string,
  title: PropTypes.string
};
Banner.defaultProps = {};
export default Banner;
window["__ANIMA__FILE__./src/__fixtures__/JSX/code.jsx"] = {
  "prop-types": [{
    "name": "PropTypes",
    "isDefault": true
  }],
  "src/__fixtures__/Button": [{
    "name": "Button",
    "isDefault": true
  }],
  "src/__fixtures__/Icon": [{
    "name": "Icon",
    "isDefault": true
  }]
};