from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from enum import Enum
import uuid
import time


class GameState(Enum):
    WAITING = "waiting"
    PLAYING = "playing"
    ROUND_END = "round_end"
    GAME_OVER = "game_over"


@dataclass
class Player:
    """Représente un joueur dans une partie"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    sid: str = ""
    is_alive: bool = True
    score: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class GameRoom:
    """Représente une salle de jeu générique"""
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
        self.players[player.id] = player
    
    def remove_player(self, player_id: str) -> Optional[Player]:
        return self.players.pop(player_id, None)
    
    def get_player(self, player_id: str) -> Optional[Player]:
        return self.players.get(player_id)
    
    def get_alive_players(self) -> List[Player]:
        return [p for p in self.players.values() if p.is_alive]
    
    def get_players_list(self) -> List[Dict]:
        return [{"id": p.id, "name": p.name, "is_alive": p.is_alive} for p in self.players.values()]


class BaseGame(ABC):
    """Classe abstraite pour tous les modes de jeu"""
    
    @property
    @abstractmethod
    def game_type(self) -> str:
        """Retourne l'identifiant unique du mode de jeu"""
        pass
    
    @property
    @abstractmethod
    def min_players(self) -> int:
        pass
    
    @property
    @abstractmethod
    def max_players(self) -> int:
        pass
    
    @abstractmethod
    def can_start(self, room: GameRoom) -> tuple[bool, str]:
        """Vérifie si la partie peut démarrer"""
        pass
    
    @abstractmethod
    def on_game_start(self, room: GameRoom) -> Dict[str, Any]:
        """
        Appelé quand la partie démarre.
        Retourne les données à envoyer aux clients.
        """
        pass
    
    @abstractmethod
    def on_round_start(self, room: GameRoom) -> Dict[str, Any]:
        """
        Appelé au début d'un round.
        Retourne les données à envoyer aux clients.
        """
        pass
    
    @abstractmethod
    def on_player_action(self, room: GameRoom, player_id: str, action: str, data: Any) -> tuple[bool, Optional[Dict]]:
        """
        Appelé quand un joueur effectue une action.
        Retourne (succès, données à diffuser)
        """
        pass
    
    @abstractmethod
    def on_round_end(self, room: GameRoom) -> Dict[str, Any]:
        """
        Appelé à la fin d'un round.
        Retourne les résultats du round.
        """
        pass
    
    @abstractmethod
    def on_game_over(self, room: GameRoom) -> Dict[str, Any]:
        """
        Appelé quand la partie se termine.
        Retourne les résultats finaux.
        """
        pass
    
    @abstractmethod
    def get_room_state(self, room: GameRoom) -> Dict[str, Any]:
        """Retourne l'état public de la salle"""
        pass