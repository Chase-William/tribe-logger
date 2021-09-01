import React from 'react';
import { AppBar, Tab } from '@material-ui/core';
import './App.global.css';
import { TabContext, TabList, TabPanel } from '@material-ui/lab';
import Settings from './Settings';
import Home from './Home';

export default function App() {
  const [value, setValue] = React.useState('0');

  // eslint-disable-next-line @typescript-eslint/ban-types
  const handleChange = (_event: React.ChangeEvent<{}>, newValue: string) => {
    // Update key for our current TabPanel
    setValue(newValue);
  };

  return (
    <div>
      <TabContext value={value}>
        <AppBar position="fixed">
          <TabList
            onChange={handleChange}
            aria-label="simple tabs example"
            centered
          >
            <Tab label="Home" value="0" />
            <Tab label="Settings" value="1" />
          </TabList>
        </AppBar>
        <TabPanel value="0">
          <Home />
        </TabPanel>
        <TabPanel value="1">
          <Settings />
        </TabPanel>
      </TabContext>
    </div>
  );
}
