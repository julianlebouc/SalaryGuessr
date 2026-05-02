import asyncio
import socketio
from typing import Dict, Any

from .room_manager import get_room_manager
from .base import GameState
from backend.config import BR_ROUND_DURATION, BR_PAUSE_BETWEEN_ROUNDS


class SocketHandlers:
    """Gestionnaire générique des événements Socket.IO"""
    
    def __init__(self, sio: socketio.AsyncServer):
        self.sio = sio
        self.room_manager = get_room_manager()
        self.active_timers: Dict[str, asyncio.Task] = {}
        self.ending_rounds: set[str] = set()
        self.next_round_events: Dict[str, asyncio.Event] = {}
        self._register_handlers()
    
    def _register_handlers(self):
        """Enregistre tous les handlers génériques"""
        
        @self.sio.on("connect")
        async def handle_connect(sid, environ):
            print(f"[SOCKET] Connecté: {sid}")
        
        @self.sio.on("disconnect")
        async def handle_disconnect(sid):
            print(f"[SOCKET] Déconnecté: {sid}")
            result = self.room_manager.get_room_by_sid(sid)
            if result:
                code, room = result
                player_id = None
                for pid, player in room.players.items():
                    if player.sid == sid:
                        player_id = pid
                        break
                if player_id:
                    self.room_manager.remove_player(code, player_id)
                    await self.broadcast_room(code, "player_joined", None)
        
        @self.sio.on("create_room")
        async def handle_create_room(sid, data):
            game_type = data.get("game_type")
            name = data.get("name", "Joueur")
            
            try:
                code, player_id = self.room_manager.create_room(game_type, name, sid)
                self.sio.enter_room(sid, code)
                
                await self.sio.emit("room_created", {"code": code, "player_id": player_id}, to=sid)
                await self.send_room_state(sid, code)
                
            except ValueError as e:
                await self.sio.emit("error", {"message": str(e)}, to=sid)
        
        @self.sio.on("join_room")
        async def handle_join_room(sid, data):
            code = data.get("code")
            name = data.get("name", "Joueur")
            
            player_id, error = self.room_manager.join_room(code, name, sid)
            if error:
                await self.sio.emit("error", {"message": error}, to=sid)
                return
            
            self.sio.enter_room(sid, code)
            await self.sio.emit("joined", {"player_id": player_id}, to=sid)
            await self.send_room_state(sid, code)
            await self.broadcast_room(code, "player_joined", None)
        
        @self.sio.on("start_game")
        async def handle_start_game(sid, data):
            code = data.get("code")
            
            room = self.room_manager.get_room(code)
            if not room:
                await self.sio.emit("error", {"message": "Salle introuvable"}, to=sid)
                return
            
            if room.host_sid != sid:
                await self.sio.emit("error", {"message": "Seul l'hôte peut démarrer"}, to=sid)
                return
            
            game = self.room_manager.get_game(code)
            if not game:
                await self.sio.emit("error", {"message": "Mode de jeu invalide"}, to=sid)
                return
            
            can_start, msg = game.can_start(room)
            if not can_start:
                await self.sio.emit("error", {"message": msg}, to=sid)
                return
            
            room.game_state = GameState.PLAYING
            start_data = game.on_game_start(room)
            
            await self.broadcast_room(code, "game_started", start_data)
            
            await self.start_round(code)
        
        @self.sio.on("game_action")
        async def handle_game_action(sid, data):
            code = data.get("code")
            action = data.get("action")
            action_data = data.get("data")
            
            room = self.room_manager.get_room(code)
            if not room:
                await self.sio.emit("error", {"message": "Salle introuvable"}, to=sid)
                return
            
            player_id = None
            for pid, player in room.players.items():
                if player.sid == sid:
                    player_id = pid
                    break
            
            if not player_id:
                await self.sio.emit("error", {"message": "Joueur non trouvé"}, to=sid)
                return
            
            game = self.room_manager.get_game(code)
            if not game:
                return
            
            success, broadcast_data = game.on_player_action(room, player_id, action, action_data)
            
            if success:
                await self.sio.emit("action_confirmed", {"action": action}, to=sid)
                
                if broadcast_data:
                    await self.broadcast_room(code, "action_broadcast", broadcast_data)
                
                # Vérifier immédiatement si tous ont répondu
                alive_players = [p for p in room.players.values() if p.is_alive]
                guesses_count = len(room.game_data.get("guesses", {}))
                
                if guesses_count >= len(alive_players) and len(alive_players) > 0:
                    print(f"[SOCKET] Dernier joueur a répondu, fin du round immédiate")
                    await self.end_round(code)

        @self.sio.on("start_next_round")
        async def handle_start_next_round(sid, data):
            code = data.get("code")

            room = self.room_manager.get_room(code)
            if not room:
                await self.sio.emit("error", {"message": "Salle introuvable"}, to=sid)
                return

            if room.host_sid != sid:
                await self.sio.emit("error", {"message": "Seul l'hôte peut lancer la prochaine manche"}, to=sid)
                return

            if room.game_state != GameState.ROUND_END:
                await self.sio.emit("error", {"message": "La manche suivante ne peut pas être lancée maintenant"}, to=sid)
                return

            event = self.next_round_events.get(code)
            if event:
                event.set()
    
    async def broadcast_room(self, room_code: str, event: str, data: Dict = None):
        room = self.room_manager.get_room(room_code)
        if not room:
            return
        
        if event == "player_joined":
            await self.sio.emit(event, {"players": room.get_players_list()}, room=room_code)
        else:
            await self.sio.emit(event, data, room=room_code)
    
    async def send_room_state(self, sid: str, room_code: str):
        state = self.room_manager.get_room_state(room_code)
        if state:
            await self.sio.emit("room_state", state, to=sid)
    
    async def start_round(self, room_code: str):
        room = self.room_manager.get_room(room_code)
        if not room or room.game_state != GameState.PLAYING:
            return
        
        game = self.room_manager.get_game(room_code)
        if not game:
            return
        
        if room_code in self.active_timers:
            self.active_timers[room_code].cancel()
        
        round_data = game.on_round_start(room)
        await self.broadcast_room(room_code, "round_start", round_data)
        
        task = asyncio.create_task(self._round_timer(room_code))
        self.active_timers[room_code] = task
    
    async def _round_timer(self, room_code: str):
        room = self.room_manager.get_room(room_code)
        if not room:
            return
        
        game = self.room_manager.get_game(room_code)
        if not game:
            return
        
        duration = getattr(game, "round_duration", BR_ROUND_DURATION)
        
        for remaining in range(duration, 0, -1):
            if room.game_state != GameState.PLAYING:
                return
            
            await self.broadcast_room(room_code, "timer_update", {"remaining": remaining})
            
            alive_players = [p for p in room.players.values() if p.is_alive]
            guesses_count = len(room.game_data.get("guesses", {}))
            
            if guesses_count >= len(alive_players) and len(alive_players) > 0:
                print(f"[SOCKET] Tous les joueurs ont répondu, fin du round anticipée")
                await self.end_round(room_code)
                return
            
            await asyncio.sleep(1)
        
        if room.game_state == GameState.PLAYING:
            await self.broadcast_room(room_code, "timer_update", {"remaining": 0})
            await self.end_round(room_code)
    
    async def end_round(self, room_code: str):
        room = self.room_manager.get_room(room_code)
        if not room:
            return
        if room_code in self.ending_rounds:
            return
        self.ending_rounds.add(room_code)
        
        try:
            game = self.room_manager.get_game(room_code)
            if not game:
                return
            
            timer_task = self.active_timers.get(room_code)
            current_task = asyncio.current_task()
            if timer_task and timer_task is not current_task:
                timer_task.cancel()
            if room_code in self.active_timers:
                del self.active_timers[room_code]
            
            room.game_state = GameState.ROUND_END
            round_results = game.on_round_end(room)
            pause_duration = getattr(game, "pause_between_rounds", BR_PAUSE_BETWEEN_ROUNDS)
            round_results["pause_duration"] = pause_duration
            game_over_after_pause = game.on_game_over(room)
            round_results["will_game_over"] = game_over_after_pause.get("is_over", False)
            await self.broadcast_room(room_code, "round_end", round_results)

            next_round_event = asyncio.Event()
            self.next_round_events[room_code] = next_round_event
            for remaining in range(pause_duration, 0, -1):
                await self.broadcast_room(room_code, "between_round_update", {"remaining": remaining})
                try:
                    await asyncio.wait_for(next_round_event.wait(), timeout=1)
                    break
                except asyncio.TimeoutError:
                    continue
            await self.broadcast_room(room_code, "between_round_update", {"remaining": 0})

            if game_over_after_pause.get("is_over", False):
                room.game_state = GameState.GAME_OVER
                await self.broadcast_room(room_code, "game_over", game_over_after_pause)
                return
            
            room.game_state = GameState.PLAYING
            await self.start_round(room_code)
        finally:
            self.ending_rounds.discard(room_code)
            self.next_round_events.pop(room_code, None)