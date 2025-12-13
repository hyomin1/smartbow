import time


class PersonService:
    def __init__(self, timeout=1.5):
        self.persons = []
        self.last_timestamp = None
        self.timeout = timeout

    def update_detections(self, persons):
        self.persons = persons
        self.last_timestamp = time.time()

    def get_detections(self):
        if not self.last_timestamp:
            return []

        if time.time() - self.last_timestamp > self.timeout:
            self.persons = []
            return []

        return self.persons
