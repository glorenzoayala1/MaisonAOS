from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Dict, Any, List, Optional
import json
from pathlib import Path


# -------- Data models -------- #

@dataclass
class Device:
    id: str
    type: str  # e.g. "light", "speaker", "mirror", "thermostat"
    room_id: str
    state: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Room:
    id: str
    name: str
    surfaces: List[str] = field(default_factory=list)  # e.g. ["mirror", "desk_surface"]
    devices: List[str] = field(default_factory=list)   # device ids
    context: Dict[str, Any] = field(default_factory=dict)


@dataclass
class UserState:
    current_room: Optional[str] = None
    wake_time: Optional[str] = None   # "07:30" etc.
    sleep_time: Optional[str] = None
    mood: Optional[str] = None
    energy: Optional[float] = None
    priority: Optional[str] = None    # "get_ready", "focus", "rest"


@dataclass
class HomeGraphModel:
    rooms: Dict[str, Room] = field(default_factory=dict)
    devices: Dict[str, Device] = field(default_factory=dict)
    user: UserState = field(default_factory=UserState)


# -------- Manager -------- #

class HomeGraphManager:
    """
    Manages the in-memory representation of the home:
      - rooms
      - devices
      - user state

    v0: loads from / saves to a simple JSON file.
    Later: can be backed by DB, API, etc.
    """

    def __init__(self, config_path: Optional[Path] = None):
        self.config_path = config_path or (Path(__file__).parent / "home_graph.json")
        self.graph = HomeGraphModel()
        self._load_or_init()

    # ----- persistence ----- #

    def _load_or_init(self) -> None:
        if self.config_path.exists():
            try:
                data = json.loads(self.config_path.read_text())
                self._from_dict(data)
            except Exception as e:
                print(f"[HomeGraph] Failed to load {self.config_path}: {e}")
                self._init_default()
        else:
            self._init_default()
            self.save()

    def _init_default(self) -> None:
        """
        Default graph: bedroom + bathroom + mirror as a device.
        This is purely for local dev and expands later as we add real devices.
        """
        bedroom = Room(
            id="bedroom",
            name="Bedroom",
            surfaces=["mirror"],
            devices=["mirror_main", "bedroom_light"],
            context={"lightingLevel": 0.3, "ambience": "warm"}
        )
        bathroom = Room(
            id="bathroom",
            name="Bathroom",
            surfaces=["mirror"],
            devices=["bath_light"],
            context={"lightingLevel": 0.8, "ambience": "bright"}
        )

        mirror_device = Device(
            id="mirror_main",
            type="mirror",
            room_id="bedroom",
            state={"online": True}
        )
        bedroom_light = Device(
            id="bedroom_light",
            type="light",
            room_id="bedroom",
            state={"on": False, "brightness": 0.3, "color": "warm"}
        )
        bath_light = Device(
            id="bath_light",
            type="light",
            room_id="bathroom",
            state={"on": False, "brightness": 0.8, "color": "cool"}
        )

        user = UserState(
            current_room="bedroom",
            wake_time="07:30",
            sleep_time="23:30",
            mood=None,
            energy=None,
            priority="get_ready",
        )

        self.graph.rooms = {
            bedroom.id: bedroom,
            bathroom.id: bathroom,
        }
        self.graph.devices = {
            mirror_device.id: mirror_device,
            bedroom_light.id: bedroom_light,
            bath_light.id: bath_light,
        }
        self.graph.user = user

    def save(self) -> None:
        try:
            data = self._to_dict()
            self.config_path.write_text(json.dumps(data, indent=2))
        except Exception as e:
            print(f"[HomeGraph] Failed to save {self.config_path}: {e}")

    def _to_dict(self) -> Dict[str, Any]:
        return {
            "rooms": {rid: asdict(room) for rid, room in self.graph.rooms.items()},
            "devices": {did: asdict(dev) for did, dev in self.graph.devices.items()},
            "user": asdict(self.graph.user),
        }

    def _from_dict(self, data: Dict[str, Any]) -> None:
        rooms = {
            rid: Room(**room_dict)
            for rid, room_dict in data.get("rooms", {}).items()
        }
        devices = {
            did: Device(**dev_dict)
            for did, dev_dict in data.get("devices", {}).items()
        }
        user = UserState(**data.get("user", {}))
        self.graph = HomeGraphModel(rooms=rooms, devices=devices, user=user)

    # ----- convenience methods ----- #

    def get_room(self, room_id: str) -> Optional[Room]:
        return self.graph.rooms.get(room_id)

    def get_device(self, device_id: str) -> Optional[Device]:
        return self.graph.devices.get(device_id)

    def get_devices_in_room(self, room_id: str, device_type: Optional[str] = None) -> List[Device]:
        room = self.get_room(room_id)
        if not room:
            return []
        devices = [self.graph.devices[did] for did in room.devices if did in self.graph.devices]
        if device_type:
            devices = [d for d in devices if d.type == device_type]
        return devices

    def update_device_state(self, device_id: str, new_state: Dict[str, Any]) -> None:
        dev = self.graph.devices.get(device_id)
        if not dev:
            print(f"[HomeGraph] Unknown device {device_id}")
            return
        dev.state.update(new_state)
        self.save()

    def set_user_room(self, room_id: str) -> None:
        if room_id not in self.graph.rooms:
            print(f"[HomeGraph] Unknown room {room_id}")
            return
        self.graph.user.current_room = room_id
        self.save()

    def set_user_priority(self, priority: str) -> None:
        self.graph.user.priority = priority
        self.save()

    def snapshot(self) -> Dict[str, Any]:
        """
        Return a dict snapshot of the entire home graph.
        Useful for debugging, logging, or sending to the frontend.
        """
        return self._to_dict()

