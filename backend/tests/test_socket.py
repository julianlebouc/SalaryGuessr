import pytest
from unittest.mock import AsyncMock, MagicMock, patch, ANY
from backend.multiplayer.socket_handlers import SocketHandlers
from backend.multiplayer.room_manager import get_room_manager
from backend.multiplayer.games.battle_royale import BattleRoyaleGame

@pytest.fixture(autouse=True)
def reset_singleton():
    """Ensure RoomManager is totally reset between tests."""
    from backend.multiplayer import room_manager
    room_manager._room_manager = None
    from backend.multiplayer.room_manager import RoomManager
    RoomManager._instance = None

@pytest.fixture
def mock_sio():
    """Create a mock Socket.IO server with correct sync/async mix."""
    sio = AsyncMock()
    # enter_room and leave_room are sync in python-socketio even for AsyncServer
    sio.enter_room = MagicMock()
    sio.leave_room = MagicMock()
    # Mock the decorator @sio.on
    sio.on = MagicMock(side_effect=lambda name: lambda func: func)
    return sio

@pytest.fixture
def handlers(mock_sio):
    """Initialize SocketHandlers with a fresh manager."""
    rm = get_room_manager()
    rm.register_game(BattleRoyaleGame())
    return SocketHandlers(mock_sio)

@pytest.mark.asyncio
async def test_socket_create_room(handlers, mock_sio):
    """Test the create_room socket event."""
    handlers_map = {}
    mock_sio.on.side_effect = lambda name: lambda f: handlers_map.update({name: f}) or f
    handlers._register_handlers()
    
    await handlers_map["create_room"]("sid_1", {"game_type": "battle_royale", "name": "Host"})
    
    rm = get_room_manager()
    assert len(rm._rooms) == 1
    code = list(rm._rooms.keys())[0]
    
    mock_sio.emit.assert_any_call("room_created", {"code": code, "player_id": ANY}, to="sid_1")
    mock_sio.enter_room.assert_called_with("sid_1", code)

@pytest.mark.asyncio
async def test_socket_join_room(handlers, mock_sio):
    """Test the join_room socket event."""
    handlers_map = {}
    mock_sio.on.side_effect = lambda name: lambda f: handlers_map.update({name: f}) or f
    handlers._register_handlers()
    
    rm = get_room_manager()
    code, _ = rm.create_room("battle_royale", "Host", "sid_1")
    
    await handlers_map["join_room"]("sid_2", {"code": code, "name": "Guest"})
    
    assert len(rm.get_room(code).players) == 2
    mock_sio.emit.assert_any_call("joined", {"player_id": ANY}, to="sid_2")

@pytest.mark.asyncio
async def test_socket_disconnect(handlers, mock_sio):
    """Test player cleanup on disconnect."""
    handlers_map = {}
    mock_sio.on.side_effect = lambda name: lambda f: handlers_map.update({name: f}) or f
    handlers._register_handlers()
    
    rm = get_room_manager()
    code, pid = rm.create_room("battle_royale", "Host", "sid_1")
    
    # Verify room was created
    assert rm.get_room(code) is not None
    
    with patch.object(handlers, 'broadcast_room', new_callable=AsyncMock):
        await handlers_map["disconnect"]("sid_1")
    
    assert rm.get_room(code) is None
