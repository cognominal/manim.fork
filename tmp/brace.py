from manim import Brace, Create, DOWN, LEFT, Line, RIGHT, Scene, Write


class BraceExample(Scene):
    def construct(self):
        line = Line(LEFT * 3, RIGHT * 2)
        brace = Brace(line, DOWN)
        label = brace.get_text("length L")

        self.add(line)
        self.play(Create(brace), Write(label))
        self.wait()
