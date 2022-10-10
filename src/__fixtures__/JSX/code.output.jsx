function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

import React from "react";
import Button from "@mui/material/Button";
import { Delete, Send } from "@mui/icons-material";
export { default as Moez } from '../JSX';
export default {
  component: Button,
  argTypes: {
    title: {
      type: "string",
      defaultValue: "Button"
    },
    variant: {
      control: {
        type: "select"
      },
      options: ["contained", "outlined", "text"],
      defaultValue: "contained"
    },
    size: {
      control: {
        type: "select"
      },
      options: ["small", "medium", "large"],
      defaultValue: "medium"
    }
  }
};
export const Story = args => {
  const {
    title,
    ...other
  } = args;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(ReactComment, {
    "data-anima": "{\"componentData\":{\"pkg\":\"@mui/material/Button\",\"tagName\":\"Button\"}}"
  }), /*#__PURE__*/React.createElement(Button, _extends({}, other, {
    "is-anima": "true"
  }), title));
};
Story.args = {
  title: "Button",
  color: "primary",
  size: "large",
  variant: "contained"
};

if (!window.ReactComment) {
  window.ReactComment = props => {
    try {
      const React = require('react');

      const animaData = props['data-anima'];
      if (!animaData) return null;
      const ref = React.createRef();
      React.useLayoutEffect(() => {
        let el = null;
        let parent = null;
        let comm = null;

        if (ref.current) {
          el = ref.current;
          parent = el.parentNode;
          comm = window.document.createComment(animaData);

          try {
            if (parent && parent.contains(el)) {
              parent.replaceChild(comm, el);
            }
          } catch (err) {
            console.error(err);
          }
        }

        return () => {
          if (parent && el && comm) {
            parent.replaceChild(el, comm);
          }
        };
      }, []);
      return React.createElement('span', {
        ref,
        style: {
          display: 'none'
        }
      }, []);
    } catch (e) {
      return null;
    }
  };
}