import UsersPanel from './UsersPanel';
import ChannelList from './ChannelList';
import './Sidebar.css';

export default function Sidebar({
  users, username,
  channels, currentChannel,
  onChannelSelect, onChannelCreate,
  setError
}) {
  return (
    <div className="sidebar">
      <UsersPanel users={users} username={username} />
      <ChannelList
        channels={channels}
        currentChannel={currentChannel}
        username={username}
        onChannelSelect={onChannelSelect}
        onChannelCreate={onChannelCreate}
        setError={setError}
      />
    </div>
  );
}
