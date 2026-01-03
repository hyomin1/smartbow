import time


class PersonService:
    def __init__(self, timeout=1.5):
        self.person = None
        self.last_timestamp = None
        self.timeout = timeout

    def update_detections(self, person):
        self.person = person
        self.last_timestamp = time.time()

    def get_detection(self):
        if self.person is None or self.last_timestamp is None:
            return None

        if time.time() - self.last_timestamp > self.timeout:
            self.person = None

            return None

        return self.person
