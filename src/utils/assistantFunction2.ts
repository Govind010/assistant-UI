export function fetchRooms(){
    fetch("/api/rooms")
      .then((response) => response.json())
      .then((data) => {
        if (data.rooms && Array.isArray(data.rooms) && data.rooms.length > 0) {
          console.log("Rooms fetched from server.");
          return data.rooms;
        }
      })
      .catch((error) => console.error("Error:", error));
}