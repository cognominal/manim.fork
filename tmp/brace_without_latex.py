from manim import Brace, Create, DOWN, LEFT, Line, RIGHT, Scene, Text, Write


class BraceWithoutLatex(Scene):
    def construct(self):
        line = Line(LEFT * 3, RIGHT * 2)
        brace = Brace(line, DOWN)
        label = Text("length L", font_size=36)
        brace.put_at_tip(label)

        self.add(line)
        self.play(Create(brace), Write(label))
        self.wait()
