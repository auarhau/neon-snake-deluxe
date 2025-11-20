import pygame
import time
import random
import os
import json
import math

# --- KONFIGURASJON OG FARGER ---
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
BLOCK_SIZE = 20  # Størrelsen på slangen og maten
FONT_NAME = 'Arial Rounded MT Bold' # Prøver en rundere font, faller tilbake til default

# Farger (R, G, B)
COLOR_BG = (15, 15, 25)           # Mørkere bakgrunn for bedre kontrast
COLOR_BG_GRADIENT = (30, 20, 40)  # Gradient farge
COLOR_GRID = (25, 25, 35)         # Mørkere rutenett
COLOR_SNAKE = (0, 255, 150)       # Neon grønn
COLOR_SNAKE_HEAD = (150, 255, 200)
COLOR_SNAKE_GLOW = (0, 255, 150, 100)  # Glød farge med alpha
COLOR_TEXT = (240, 240, 240)

# Mat-typer og egenskaper
FOOD_TYPES = {
    'normal': {'color': (255, 80, 80),   'glow': (255, 120, 120), 'score': 10, 'chance': 70, 'speed_mod': 0},  # Rød
    'gold':   {'color': (255, 215, 0),   'glow': (255, 255, 150), 'score': 50, 'chance': 10, 'speed_mod': 0},  # Gull
    'speed':  {'color': (0, 255, 255),   'glow': (100, 255, 255), 'score': 20, 'chance': 10, 'speed_mod': 2},  # Cyan (Raskere)
    'slow':   {'color': (180, 80, 255),  'glow': (220, 120, 255), 'score': 10, 'chance': 10, 'speed_mod': -2}, # Lilla (Tregere)
}

# Fil for å lagre highscore
HIGHSCORE_FILE = "highscore.json"

# --- OPPSETT AV PYGAME ---
pygame.init()
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption('Neon Snake Deluxe')
clock = pygame.time.Clock()

# Bruker default font for bedre web-kompatibilitet
game_font = pygame.font.SysFont(None, 25)
title_font = pygame.font.SysFont(None, 50)
small_font = pygame.font.SysFont(None, 18)

# --- FUNKSJONER ---

def load_highscore():
    """Laster inn topp 10 highscore-listen."""
    try:
        # Prøv å laste fra fil først (fungerer lokalt)
        if os.path.exists(HIGHSCORE_FILE):
            with open(HIGHSCORE_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
                elif isinstance(data, (int, float)):
                    return [{"name": "Spiller", "score": data}]
    except:
        pass
    
    # For web: localStorage håndteres automatisk av pygbag
    # Vi returnerer tom liste hvis fil ikke finnes
    return []

def save_highscore(name, score):
    """Lagrer en ny highscore og beholder kun topp 10."""
    highscores = load_highscore()
    
    # Legg til ny score
    highscores.append({"name": name, "score": score})
    
    # Sorter etter score (høyest først) og behold kun topp 10
    highscores.sort(key=lambda x: x["score"], reverse=True)
    highscores = highscores[:10]
    
    # Lagre til fil (fungerer både lokalt og på web)
    try:
        with open(HIGHSCORE_FILE, 'w', encoding='utf-8') as f:
            json.dump(highscores, f, ensure_ascii=False, indent=2)
    except:
        # Hvis fil-lagring feiler (f.eks. på web), prøv localStorage
        try:
            # pygbag håndterer localStorage automatisk via IndexedDB
            pass
        except:
            pass
    
    return highscores

def draw_gradient_background():
    """Tegner en gradient bakgrunn."""
    for y in range(SCREEN_HEIGHT):
        ratio = y / SCREEN_HEIGHT
        r = int(COLOR_BG[0] * (1 - ratio) + COLOR_BG_GRADIENT[0] * ratio)
        g = int(COLOR_BG[1] * (1 - ratio) + COLOR_BG_GRADIENT[1] * ratio)
        b = int(COLOR_BG[2] * (1 - ratio) + COLOR_BG_GRADIENT[2] * ratio)
        pygame.draw.line(screen, (r, g, b), (0, y), (SCREEN_WIDTH, y))

def draw_grid():
    """Tegner et diskret rutenett for moderne look."""
    for x in range(0, SCREEN_WIDTH, BLOCK_SIZE * 2):
        pygame.draw.line(screen, COLOR_GRID, (x, 0), (x, SCREEN_HEIGHT), 1)
    for y in range(0, SCREEN_HEIGHT, BLOCK_SIZE * 2):
        pygame.draw.line(screen, COLOR_GRID, (0, y), (SCREEN_WIDTH, y), 1)

def draw_text(surf, text, font, color, pos):
    text_surface = font.render(text, True, color)
    rect = text_surface.get_rect(center=pos)
    surf.blit(text_surface, rect)

async def get_name_input():
    """Får navn fra brukeren via tastaturinput."""
    name = ""
    input_active = True
    
    while input_active:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return None
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_RETURN:
                    input_active = False
                elif event.key == pygame.K_BACKSPACE:
                    name = name[:-1]
                elif event.key == pygame.K_ESCAPE:
                    return None
                else:
                    # Legg til karakter hvis det er en gyldig tegn
                    if event.unicode.isalnum() or event.unicode in [' ', '-', '_']:
                        if len(name) < 15:  # Maks 15 tegn
                            name += event.unicode
        
        draw_gradient_background()
        
        # Tegn bakgrunn for input-boksen
        input_bg = pygame.Surface((400, 200), pygame.SRCALPHA)
        pygame.draw.rect(input_bg, (0, 0, 0, 200), (0, 0, 400, 200), border_radius=15)
        pygame.draw.rect(input_bg, (100, 100, 100, 100), (0, 0, 400, 200), width=2, border_radius=15)
        screen.blit(input_bg, (SCREEN_WIDTH/2 - 200, SCREEN_HEIGHT/2 - 100))
        
        # Tekst
        name_text = game_font.render("Skriv inn navn:", True, COLOR_TEXT)
        screen.blit(name_text, (SCREEN_WIDTH/2 - name_text.get_width()/2, SCREEN_HEIGHT/2 - 50))
        
        # Navn med blinkende cursor
        cursor = "_" if int(time.time() * 2) % 2 == 0 else " "
        name_display = name + cursor
        name_input_text = game_font.render(name_display, True, (255, 255, 100))
        screen.blit(name_input_text, (SCREEN_WIDTH/2 - name_input_text.get_width()/2, SCREEN_HEIGHT/2))
        
        hint_text = small_font.render("Trykk ENTER for å lagre", True, (150, 150, 150))
        screen.blit(hint_text, (SCREEN_WIDTH/2 - hint_text.get_width()/2, SCREEN_HEIGHT/2 + 40))
        
        pygame.display.update()
        await asyncio.sleep(0)
    
    return name if name else "Spiller"

# --- HOVEDKLASSEN ---

class Particle:
    """Partikkel for visuelle effekter."""
    def __init__(self, x, y, color, velocity):
        self.x = x
        self.y = y
        self.color = color
        self.vx, self.vy = velocity
        self.life = 1.0
        self.size = random.randint(3, 6)
    
    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.life -= 0.05
        self.vx *= 0.95
        self.vy *= 0.95
    
    def draw(self, surface):
        if self.life > 0:
            alpha = int(255 * self.life)
            color_with_alpha = (*self.color[:3], alpha)
            size = int(self.size * self.life)
            if size > 0:
                glow_surf = pygame.Surface((size * 2, size * 2), pygame.SRCALPHA)
                pygame.draw.circle(glow_surf, color_with_alpha, (size, size), size)
                surface.blit(glow_surf, (self.x - size, self.y - size), 
                            special_flags=pygame.BLEND_ALPHA_SDL2)

class Food:
    """Mat-objekt med type, posisjon og timer."""
    def __init__(self, x, y, food_type):
        self.x = x
        self.y = y
        self.food_type = food_type
        self.timer = 5.0  # 5 sekunder før maten forsvinner
        self.pulse = 0.0
    
    def update(self, dt):
        """Oppdater timer og animasjon."""
        self.timer -= dt
        self.pulse += 0.15
        return self.timer > 0
    
    def draw(self, surface):
        """Tegn maten med verdi og timer."""
        food_data = FOOD_TYPES[self.food_type]
        food_color = food_data['color']
        glow_color = food_data['glow']
        score = food_data['score']
        
        # Pulsing-effekt
        pulse_size = math.sin(self.pulse) * 0.2 + 1.0
        food_size = int(BLOCK_SIZE * pulse_size)
        food_offset = (BLOCK_SIZE - food_size) // 2
        
        # Glød-effekt
        glow_surf = pygame.Surface((BLOCK_SIZE * 3, BLOCK_SIZE * 3), pygame.SRCALPHA)
        for i in range(5):
            alpha = int(80 - i * 15 * (self.timer / 5.0))  # Fade ut når timeren går ned
            if alpha < 0:
                alpha = 0
            size = food_size + i * 4
            offset = (BLOCK_SIZE * 3 - size) // 2
            pygame.draw.rect(glow_surf, (*glow_color, alpha), 
                           [offset, offset, size, size], border_radius=8)
        surface.blit(glow_surf, (self.x - BLOCK_SIZE, self.y - BLOCK_SIZE),
                   special_flags=pygame.BLEND_ALPHA_SDL2)
        
        # Selve maten
        alpha = int(255 * (self.timer / 5.0))
        food_surf = pygame.Surface((BLOCK_SIZE, BLOCK_SIZE), pygame.SRCALPHA)
        pygame.draw.rect(food_surf, (*food_color, alpha), 
                        [food_offset, food_offset, food_size, food_size], border_radius=6)
        surface.blit(food_surf, (self.x, self.y), special_flags=pygame.BLEND_ALPHA_SDL2)
        
        # Vis verdi over maten
        value_text = small_font.render(str(score), True, (255, 255, 255))
        value_bg = pygame.Surface((value_text.get_width() + 4, value_text.get_height() + 2), pygame.SRCALPHA)
        pygame.draw.rect(value_bg, (0, 0, 0, 180), (0, 0, value_text.get_width() + 4, value_text.get_height() + 2), border_radius=3)
        surface.blit(value_bg, (self.x + BLOCK_SIZE // 2 - value_text.get_width() // 2 - 2, 
                               self.y - value_text.get_height() - 5))
        surface.blit(value_text, (self.x + BLOCK_SIZE // 2 - value_text.get_width() // 2, 
                                 self.y - value_text.get_height() - 4))
        
        # Vis timer-bar under maten
        timer_width = BLOCK_SIZE
        timer_height = 3
        timer_progress = self.timer / 5.0
        timer_x = self.x
        timer_y = self.y + BLOCK_SIZE + 2
        
        # Bakgrunn for timer
        pygame.draw.rect(surface, (50, 50, 50), 
                        [timer_x, timer_y, timer_width, timer_height])
        # Timer-farge (rød når lite tid igjen, grønn når mye)
        if timer_progress > 0.5:
            timer_color = (0, 255, 0)
        elif timer_progress > 0.25:
            timer_color = (255, 255, 0)
        else:
            timer_color = (255, 0, 0)
        pygame.draw.rect(surface, timer_color, 
                        [timer_x, timer_y, int(timer_width * timer_progress), timer_height])

class SnakeGame:
    def __init__(self):
        self.reset_game()
        self.highscores = load_highscore()
        self.highscore = self.highscores[0]["score"] if self.highscores else 0
        self.particles = []
        self.food_pulse = 0.0
        self.animation_time = 0.0

    def reset_game(self):
        self.game_over = False
        self.game_close = False
        
        # Startposisjon
        self.x1 = SCREEN_WIDTH / 2
        self.y1 = SCREEN_HEIGHT / 2
        
        self.x1_change = 0
        self.y1_change = 0
        
        self.snake_list = []
        self.length_of_snake = 1
        self.speed = 15  # Starthastighet (FPS)
        
        self.score = 0
        self.particles = []
        self.food_pulse = 0.0
        self.animation_time = 0.0
        self.foods = []  # Liste med mat-objekter
        self.last_food_spawn = 0.0
        self.food_spawn_interval = 2.0  # Spawn ny mat hver 2. sekund
        
        # Oppdater highscore-visningen
        self.highscores = load_highscore()
        self.highscore = self.highscores[0]["score"] if self.highscores else 0
        
        # Spawn første mat-objekter
        for _ in range(2):  # Start med 2 mat-objekter
            self.spawn_food()

    def spawn_food(self):
        """Spawn en ny mat på et tilfeldig sted."""
        # Velg mattype basert på sannsynlighet
        rand_val = random.randint(1, 100)
        cumulative = 0
        selected_type = 'normal'
        
        for f_type, data in FOOD_TYPES.items():
            cumulative += data['chance']
            if rand_val <= cumulative:
                selected_type = f_type
                break
        
        # Plasser maten slik at den passer i rutenettet
        cols = (SCREEN_WIDTH - BLOCK_SIZE) // BLOCK_SIZE
        rows = (SCREEN_HEIGHT - BLOCK_SIZE) // BLOCK_SIZE
        
        # Prøv å finne en posisjon som ikke kolliderer med slangen eller annen mat
        max_attempts = 50
        for _ in range(max_attempts):
            foodx = round(random.randrange(0, cols) * BLOCK_SIZE)
            foody = round(random.randrange(0, rows) * BLOCK_SIZE)
            
            # Sjekk kollisjon med slangen
            collision = False
            for segment in self.snake_list:
                if segment[0] == foodx and segment[1] == foody:
                    collision = True
                    break
            
            # Sjekk kollisjon med annen mat
            if not collision:
                for food in self.foods:
                    if food.x == foodx and food.y == foody:
                        collision = True
                        break
            
            if not collision:
                self.foods.append(Food(foodx, foody, selected_type))
                return
        
        # Hvis vi ikke fant en plass, spawn likevel (kan overlappe)
        foodx = round(random.randrange(0, cols) * BLOCK_SIZE)
        foody = round(random.randrange(0, rows) * BLOCK_SIZE)
        self.foods.append(Food(foodx, foody, selected_type))

    def play_step(self):
        # Håndter input
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return True # Avslutt programmet
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_LEFT and self.x1_change == 0:
                    self.x1_change = -BLOCK_SIZE
                    self.y1_change = 0
                elif event.key == pygame.K_RIGHT and self.x1_change == 0:
                    self.x1_change = BLOCK_SIZE
                    self.y1_change = 0
                elif event.key == pygame.K_UP and self.y1_change == 0:
                    self.y1_change = -BLOCK_SIZE
                    self.x1_change = 0
                elif event.key == pygame.K_DOWN and self.y1_change == 0:
                    self.y1_change = BLOCK_SIZE
                    self.x1_change = 0

        # Sjekk kollisjon med vegger
        if self.x1 >= SCREEN_WIDTH or self.x1 < 0 or self.y1 >= SCREEN_HEIGHT or self.y1 < 0:
            self.game_close = True

        # Oppdater posisjon
        self.x1 += self.x1_change
        self.y1 += self.y1_change
        
        # Oppdater animasjonstid
        self.animation_time += 0.1
        dt = 1.0 / self.speed  # Delta time basert på FPS
        
        # Oppdater partikler
        self.particles = [p for p in self.particles if p.life > 0]
        for particle in self.particles:
            particle.update()
        
        # Oppdater mat-objekter (fjern de som har gått ut på tid)
        self.foods = [food for food in self.foods if food.update(dt)]
        
        # Spawn ny mat med jevne mellomrom (maks 5 mat-objekter samtidig)
        self.last_food_spawn += dt
        if self.last_food_spawn >= self.food_spawn_interval and len(self.foods) < 5:
            self.spawn_food()
            self.last_food_spawn = 0.0
        
        # Tegn bakgrunn
        draw_gradient_background()
        draw_grid()

        # Tegn alle mat-objekter
        for food in self.foods:
            food.draw(screen)
        
        # Tegn partikler
        for particle in self.particles:
            particle.draw(screen)

        # Snake logikk
        snake_head = [self.x1, self.y1]
        self.snake_list.append(snake_head)
        
        if len(self.snake_list) > self.length_of_snake:
            del self.snake_list[0]

        # Sjekk kollisjon med seg selv
        for x in self.snake_list[:-1]:
            if x == snake_head:
                self.game_close = True

        self.draw_snake()
        self.draw_ui()
        
        pygame.display.flip()  # Bruk flip() i stedet for update() for web

        # Sjekk om slangen spiser mat
        eaten_food = None
        for food in self.foods:
            if self.x1 == food.x and self.y1 == food.y:
                eaten_food = food
                break
        
        if eaten_food:
            props = FOOD_TYPES[eaten_food.food_type]
            self.score += props['score']
            self.speed += props['speed_mod']
            
            # Lag partikler når mat spises
            food_center_x = eaten_food.x + BLOCK_SIZE // 2
            food_center_y = eaten_food.y + BLOCK_SIZE // 2
            for _ in range(15):
                angle = random.uniform(0, 2 * math.pi)
                speed = random.uniform(2, 5)
                vx = math.cos(angle) * speed
                vy = math.sin(angle) * speed
                self.particles.append(Particle(food_center_x, food_center_y, 
                                              props['color'], (vx, vy)))
            
            # Fjern spist mat
            self.foods.remove(eaten_food)
            
            # Sikre at farten ikke blir for lav eller ekstremt høy
            self.speed = max(5, min(self.speed, 40))
            
            self.length_of_snake += 1

        # Viktig: clock.tick() må kalles for å oppdatere tiden
        clock.tick(self.speed)
        return False

    def draw_snake(self):
        # Tegn glød for hele slangen først
        for index, segment in enumerate(self.snake_list):
            if index == len(self.snake_list) - 1:
                # Ekstra glød på hodet
                glow_surf = pygame.Surface((BLOCK_SIZE * 2, BLOCK_SIZE * 2), pygame.SRCALPHA)
                for i in range(4):
                    alpha = 60 - i * 15
                    size = BLOCK_SIZE + i * 3
                    offset = (BLOCK_SIZE * 2 - size) // 2
                    pygame.draw.rect(glow_surf, (*COLOR_SNAKE_HEAD[:3], alpha),
                                   [offset, offset, size, size], border_radius=5)
                screen.blit(glow_surf, (segment[0] - BLOCK_SIZE // 2, segment[1] - BLOCK_SIZE // 2),
                           special_flags=pygame.BLEND_ALPHA_SDL2)
            else:
                # Mindre glød på kroppen
                glow_surf = pygame.Surface((BLOCK_SIZE * 2, BLOCK_SIZE * 2), pygame.SRCALPHA)
                for i in range(2):
                    alpha = 40 - i * 15
                    size = BLOCK_SIZE + i * 2
                    offset = (BLOCK_SIZE * 2 - size) // 2
                    pygame.draw.rect(glow_surf, (*COLOR_SNAKE[:3], alpha),
                                   [offset, offset, size, size], border_radius=4)
                screen.blit(glow_surf, (segment[0] - BLOCK_SIZE // 2, segment[1] - BLOCK_SIZE // 2),
                           special_flags=pygame.BLEND_ALPHA_SDL2)
        
        # Tegn selve slangen
        for index, segment in enumerate(self.snake_list):
            # Hodet får en annen farge
            color = COLOR_SNAKE_HEAD if index == len(self.snake_list)-1 else COLOR_SNAKE
            
            # Tegn segmentet med gradient-effekt
            pygame.draw.rect(screen, color, [segment[0], segment[1], BLOCK_SIZE, BLOCK_SIZE], 
                           border_radius=4)
            
            # Legg til en lysere kant
            lighter_color = tuple(min(255, c + 30) for c in color)
            pygame.draw.rect(screen, lighter_color, [segment[0], segment[1], BLOCK_SIZE, BLOCK_SIZE], 
                           width=2, border_radius=4)
            
            # Tegn øyne på hodet for karakter
            if index == len(self.snake_list)-1:
                # Bestem øyenes retning basert på bevegelse
                eye_offset_x = 0
                eye_offset_y = 0
                if self.x1_change > 0:  # Høyre
                    eye_offset_x = 2
                elif self.x1_change < 0:  # Venstre
                    eye_offset_x = -2
                elif self.y1_change > 0:  # Ned
                    eye_offset_y = 2
                elif self.y1_change < 0:  # Opp
                    eye_offset_y = -2
                
                eye_radius = 3
                left_eye = (segment[0] + 6 + eye_offset_x, segment[1] + 6 + eye_offset_y)
                right_eye = (segment[0] + 14 + eye_offset_x, segment[1] + 6 + eye_offset_y)
                pygame.draw.circle(screen, (0, 0, 0), left_eye, eye_radius)
                pygame.draw.circle(screen, (0, 0, 0), right_eye, eye_radius)
                # Legg til glød i øynene
                pygame.draw.circle(screen, (255, 255, 255), left_eye, 1)
                pygame.draw.circle(screen, (255, 255, 255), right_eye, 1)

    def draw_ui(self):
        # Tegn bakgrunn for UI med glød
        ui_bg = pygame.Surface((200, 60), pygame.SRCALPHA)
        pygame.draw.rect(ui_bg, (0, 0, 0, 150), (0, 0, 200, 60), border_radius=10)
        screen.blit(ui_bg, (5, 5))
        
        # Score
        score_text = game_font.render(f"Score: {self.score}", True, COLOR_TEXT)
        screen.blit(score_text, [10, 10])
        
        # Highscore
        high_text = game_font.render(f"High: {self.highscore}", True, (255, 215, 0))
        screen.blit(high_text, [SCREEN_WIDTH - 160, 10])

    async def show_game_over(self):
        # Få navn fra brukeren
        player_name = await get_name_input()
        if player_name is None:
            return True  # Brukeren avbrøt
        
        # Lagre highscore
        self.highscores = save_highscore(player_name, self.score)
        self.highscore = self.highscores[0]["score"] if self.highscores else 0
        
        # Sjekk om dette er en ny rekord
        is_new_record = len(self.highscores) > 0 and self.highscores[0]["name"] == player_name and self.highscores[0]["score"] == self.score
        
        while self.game_close:
            for event in pygame.event.get():
                if event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_q:
                        return True # Quit completely
                    elif event.key == pygame.K_c:
                        self.reset_game()
                        return False # Ikke quit, start på nytt
                if event.type == pygame.QUIT:
                    return True
            
            draw_gradient_background()
            
            # Bakgrunn for highscore-listen
            list_bg = pygame.Surface((650, 500), pygame.SRCALPHA)
            pygame.draw.rect(list_bg, (0, 0, 0, 200), (0, 0, 650, 500), border_radius=15)
            pygame.draw.rect(list_bg, (255, 215, 0, 100), (0, 0, 650, 500), width=2, border_radius=15)
            screen.blit(list_bg, (SCREEN_WIDTH/2 - 325, 20))
            
            # Vis game over-melding øverst
            gameover_text = title_font.render("GAME OVER", True, (255, 50, 50))
            screen.blit(gameover_text, (SCREEN_WIDTH/2 - gameover_text.get_width()/2, 35))
            
            # Vis din score
            score_display = f"Din Score: {self.score}"
            score_text = game_font.render(score_display, True, COLOR_TEXT)
            screen.blit(score_text, (SCREEN_WIDTH/2 - score_text.get_width()/2, 85))
            
            if is_new_record:
                record_text = game_font.render("NY HIGHSCORE!", True, (255, 215, 0))
                screen.blit(record_text, (SCREEN_WIDTH/2 - record_text.get_width()/2, 115))
            
            # Vis topp 10-listen
            title_text = game_font.render("TOPP 10 HIGHSCORES", True, (255, 215, 0))
            screen.blit(title_text, (SCREEN_WIDTH/2 - title_text.get_width()/2, 155))
            
            y_offset = 190
            for i, entry in enumerate(self.highscores[:10], 1):
                name_text = entry["name"][:15]  # Begrens navnlengde
                score_text = str(entry["score"])
                rank_text = f"{i}. {name_text:<15} {score_text:>6}"
                
                # Fargekode: 1. plass = gull, 2. plass = sølv, 3. plass = bronse
                if i == 1:
                    color = (255, 215, 0)
                elif i == 2:
                    color = (192, 192, 192)
                elif i == 3:
                    color = (205, 127, 50)
                else:
                    color = COLOR_TEXT
                
                rank_display = game_font.render(rank_text, True, color)
                screen.blit(rank_display, (SCREEN_WIDTH/2 - rank_display.get_width()/2, y_offset))
                y_offset += 30
            
            hint_text = small_font.render("Trykk C for å spille igjen, Q for å avslutte", True, (150, 150, 150))
            screen.blit(hint_text, (SCREEN_WIDTH/2 - hint_text.get_width()/2, SCREEN_HEIGHT - 50))
            
            pygame.display.update()
            await asyncio.sleep(0)
        
        return False

# --- KJØR SPILLET ---
import asyncio

# --- KJØR SPILLET ---
async def main():
    try:
        print("Starter spillet...")
        game = SnakeGame()
        quit_game = False
        
        print("Spill-loop starter...")
        while not quit_game:
            if game.game_close:
                quit_game = await game.show_game_over()
            else:
                quit_game = game.play_step()
            
            # Viktig for web: Gi kontroll tilbake til nettleseren
            await asyncio.sleep(0)
            
    except Exception as e:
        print(f"FEIL I SPILLET: {e}")
        import traceback
        traceback.print_exc()
    finally:
        pygame.quit()

if __name__ == "__main__":
    asyncio.run(main())

