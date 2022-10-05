import React from "react";
import Button from "@mui/material/Button";
import { Delete, Send } from "@mui/icons-material";

export { default as Moez } from '../JSX'

export default {
  component: Button,
  argTypes: {
    title: {
      type: "string",
      defaultValue: "Button",
    },
    variant: {
      control: { type: "select" },
      options: ["contained", "outlined", "text"],
      defaultValue: "contained",
    },
    size: {
      control: { type: "select" },
      options: ["small", "medium", "large"],
      defaultValue: "medium",
    },

  },
};



export const Story = (args) => {
  const { title, ...other } = args;
  return <Button {...other}>{title}</Button>;
};

Story.args = {
  title: "Button",
  color: "primary",
  size: "large",
  variant: "contained",
};
