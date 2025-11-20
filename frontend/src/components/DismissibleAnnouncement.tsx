import React from 'react';
import { Announcement } from './ui/Announcement';

const DismissibleAnnouncement = () => {
  return (
    <Announcement
      id="global-launch-v2"
      message="Welcome to AutoGitGrow v2.0! We've revamped the UI to focus on automation."
      variant="default"
      link={{
        href: "https://github.com/yourusername/autogitgrow",
        text: "Learn more"
      }}
    />
  );
};

export default DismissibleAnnouncement;
