import json

from channels.generic.websocket import WebsocketConsumer

from api.models import User
from api.auth import authenticate


class RealTimeConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()

    def disconnect(self, close_code):
        user = User.objects.filter(channel=self.channel_name).first()
        if user:
            user.channel = ""
            user.save()

    def receive(self, text_data):
        data = json.loads(text_data)
        if "token" in data:
            self.handle_auth(data)
        else:
            self.send(json.dumps({"error": "Token is required"}))
            self.close()

    def handle_auth(self, data):
        token = data["token"]
        user = authenticate(token)
        if not user:
            self.send(json.dumps({"error": "Invalid token"}))
            self.close()
            return
        user.channel = self.channel_name
        user.save()

    def push(self, event):
        self.send(json.dumps(event))
