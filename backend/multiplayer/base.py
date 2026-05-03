"""
Base classes and abstractions for the multiplayer system.
Defines the structure for players, rooms, and game modes.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from enum import Enum
import uuid
import time


class GameState(Enum):
    """Possible states for a game session."""
    WAITING = "waiting"
    PLAYING = "playing"
    ROUND_END = "round_end"
    GAME_OVER = "game_over"


@dataclass
class Player:
    """Represents a player in a game session."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    sid: str = ""
    is_alive: bool = True
    score: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class GameRoom:
    """Represents a generic game room containing players and state."""
    code: str
    game_type: str
    host_id: str
    host_sid: str
    host_name: str = ""
    players: Dict[str, Player] = field(default_factory=dict)
    game_state: GameState = GameState.WAITING
    game_data: Dict[str, Any] = field(default_factory=dict)
    created_at: float = field(default_factory=time.time)
    
    def add_player(self, player: Player) -> None:
        """Add a player to the room."""
        self.players[player.id] = player
    
    def remove_player(self, player_id: str) -> Optional[Player]:
        """Remove a player from the room by their ID."""
        return self.players.pop(player_id, None)
    
    def get_player(self, player_id: str) -> Optional[Player]:
        """Get a player instance by their ID."""
        return self.players.get(player_id)
    
    def get_alive_players(self) -> List[Player]:
        """Return a list of players who are still in the game."""
        return [p for p in self.players.values() if p.is_alive]
    
    def get_players_list(self) -> List[Dict]:
        """Return a serialized list of players for client synchronization."""
        return [{"id": p.id, "name": p.name, "is_alive": p.is_alive} for p in self.players.values()]


class BaseGame(ABC):
    """Abstract base class for all game modes (e.g., Battle Royale)."""
    
    @property
    @abstractmethod
    def game_type(self) -> str:
        """Returns the unique identifier of the game mode."""
        pass
    
    @property
    @abstractmethod
    def min_players(self) -> int:
        """Minimum players required to start the game."""
        pass
    
    @property
    @abstractmethod
    def max_players(self) -> int:
        """Maximum player capacity of a room."""
        pass
    
    @abstractmethod
    def can_start(self, room: GameRoom) -> tuple[bool, str]:
        """Verify if the game can start (e.g., enough players)."""
        pass
    
    @abstractmethod
    def on_game_start(self, room: GameRoom) -> Dict[str, Any]:
        """
        Logic to execute when the game transitions to PLAYING.
        
        Returns:
            Dict[str, Any]: Initial game data to broadcast.
        """
        pass
    
    @abstractmethod
    def on_round_start(self, room: GameRoom) -> Dict[str, Any]:
        """
        Logic for starting a new round.
        
        Returns:
            Dict[str, Any]: Round data (e.g., the current job offer).
        """
        pass
    
    @abstractmethod
    def on_player_action(self, room: GameRoom, player_id: str, action: str, data: Any) -> tuple[bool, Optional[Dict]]:
        """
        Handle a player input (e.g., submitting a guess).
        
        Returns:
            tuple[bool, Optional[Dict]]: (Success, Data to broadcast).
        """
        pass
    
    @abstractmethod
    def on_round_end(self, room: GameRoom) -> Dict[str, Any]:
        """
        Handle scoring and state at the end of a round.
        
        Returns:
            Dict[str, Any]: Round results.
        """
        pass
    
    @abstractmethod
    def on_game_over(self, room: GameRoom) -> Dict[str, Any]:
        """
        Handle final scoring and winner determination.
        
        Returns:
            Dict[str, Any]: Final leaderboard and results.
        """
        pass
    
    @abstractmethod
    def get_room_state(self, room: GameRoom) -> Dict[str, Any]:
        """Return the public state of the game for the room manager."""
        pass