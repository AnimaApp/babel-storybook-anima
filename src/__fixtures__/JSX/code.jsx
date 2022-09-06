import React from 'react';
import Checkbox from '@mui/material/Checkbox';


export default {
  title: 'Example/MUI Checkbox',
  component: Checkbox,
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

const Template = (args) => <Checkbox {...args} />;
export const Default = Template.bind({});

Default.args = {
  checked: true,
  disabled: false,
};


