import React from 'react';
import Checkbox from '@mui/material/Checkbox';
export default {
  title: 'Example/MUI Checkbox',
  component: Checkbox,
  argTypes: {
    checked: {
      control: 'boolean'
    },
    disabled: {
      control: 'boolean'
    }
  }
};

const Template = args => /*#__PURE__*/React.createElement("span", {
  "is-anima": "true",
  "data-name": "Checkbox",
  "data-package": "@mui/material/Checkbox"
}, /*#__PURE__*/React.createElement(Checkbox, args));

export const Default = Template.bind({});
Default.args = {
  checked: true,
  disabled: false
};
window["__ANIMA__FILE__./src/__fixtures__/JSX/code.jsx"] = {
  "@mui/material/Checkbox": [{
    "name": "Checkbox",
    "isDefault": true
  }]
};