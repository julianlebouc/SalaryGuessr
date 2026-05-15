import pytest
from unittest.mock import patch
from backend.multiplayer.room_manager import RoomManager
from backend.multiplayer.games.battle_royale import BattleRoyaleGame
from backend.multiplayer.base import GameState

@pytest.fixture
def manager():
    """Fresh RoomManager instance for each test."""
    # Reset singleton state for testing
    RoomManager._instance = None
    rm = RoomManager()
    rm.register_game(BattleRoyaleGame())
    return rm

def test_create_room(manager):
    """Test room creation."""
    code, player_id = manager.create_room("battle_royale", "Host", "sid_1")
    assert len(code) == 6
    room = manager.get_room(code)
    assert room.host_id == player_id
    assert room.host_name == "Host"
    assert len(room.players) == 1

def test_join_room(manager):
    """Test joining a room."""
    code, _ = manager.create_room("battle_royale", "Host", "sid_1")
    player_id, error = manager.join_room(code, "Guest", "sid_2")
    
    assert error is None
    assert player_id is not None
    room = manager.get_room(code)
    assert len(room.players) == 2

def test_room_full(manager):
    """Test joining a full room (mocking max_players)."""
    # Create game with 1 max player
    class MiniGame(BattleRoyaleGame):
        @property
        def max_players(self): return 1
    
    manager.register_game(MiniGame())
    code, _ = manager.create_room("battle_royale", "Host", "sid_1")
    player_id, error = manager.join_room(code, "Guest", "sid_2")
    
    assert player_id is None
    assert "full" in error.lower()

@patch("backend.multiplayer.games.battle_royale.get_normalized_job")
def test_battle_royale_elimination(mock_get_job, manager):
    """Test elimination logic in Battle Royale."""
    mock_get_job.return_value = {"id": "test_job", "salary_real": 3000}
    
    game = BattleRoyaleGame()
    code, host_id = manager.create_room("battle_royale", "Host", "sid_1")
    guest_id, _ = manager.join_room(code, "Guest", "sid_2")
    room = manager.get_room(code)
    
    # Start game
    room.game_state = GameState.PLAYING
    game.on_game_start(room)
    room.game_data["current_offer"] = {"salary_real": 3000}
    
    # Player 1 is close (2900)
    game.on_player_action(room, host_id, "submit_guess", {"guess": 2900})
    # Player 2 is far (5000)
    game.on_player_action(room, guest_id, "submit_guess", {"guess": 5000})
    
    results = game.on_round_end(room)
    
    # Guest should be eliminated
    assert guest_id in results["eliminated_ids"]
    assert room.get_player(guest_id).is_alive is False
    assert room.get_player(host_id).is_alive is True

def test_remove_player(manager):
    """Test removing players and room deletion."""
    code, host_id = manager.create_room("battle_royale", "Host", "sid_1")
    guest_id, _ = manager.join_room(code, "Guest", "sid_2")
    
    manager.remove_player(code, guest_id)
    room = manager.get_room(code)
    assert len(room.players) == 1
    
    manager.remove_player(code, host_id)
    assert manager.get_room(code) is None # Room should be deleted

def test_room_code_uniqueness(manager):
    """Test that room codes are unique."""
    codes = set()
    for _ in range(10):
        codes.add(manager.generate_room_code())
    assert len(codes) == 10

def test_memory_utils():
    """Test the memory/played tracking utility."""
    from backend.utils.memory import add_played_offer, is_played, clear_played, get_played_count
    clear_played()
    assert get_played_count() == 0
    add_played_offer("job1")
    assert is_played("job1") is True
    assert get_played_count() == 1
    clear_played()
    assert is_played("job1") is False

def test_rate_limiter():
    """Test the rate limiter utility."""
    from backend.utils.rate_limiter import RateLimiter
    import time
    limiter = RateLimiter(max_requests=100, time_window=1.0)
    
    start = time.time()
    for _ in range(5):
        limiter.wait_if_needed()
    # Should be very fast for small number of requests
    assert time.time() - start < 0.1
