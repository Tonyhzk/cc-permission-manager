#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cross-platform System Sound Player GUI
Supports macOS and Windows system sounds playback
"""

import tkinter as tk
from tkinter import ttk, scrolledtext
import platform
import os
import subprocess
import threading
from pathlib import Path

# Detect if running on Windows
IS_WINDOWS = platform.system() == "Windows"
if IS_WINDOWS:
    import winsound


class SoundPlayerGUI:
    """System Sound Player GUI Class"""

    def __init__(self, root):
        self.root = root
        self.root.title("System Sound Player")
        self.root.geometry("800x600")

        # Get system type (must be before setup_dark_theme)
        self.system_type = platform.system()

        # Setup dark theme (cross-platform)
        self.setup_dark_theme()

        # Current playback status
        self.is_playing = False
        self.current_sound = None

        # Get sound list
        self.sounds = self.get_system_sounds()

        # Create GUI
        self.create_widgets()

    def setup_dark_theme(self):
        """Setup dark theme"""
        # Set window background color
        self.root.configure(bg='#2b2b2b')

        # Create custom style
        style = ttk.Style()

        # Try to use dark theme (if available)
        available_themes = style.theme_names()

        # On Windows, try to use 'vista' or 'winnative'
        if self.system_type == "Windows":
            if 'vista' in available_themes:
                style.theme_use('vista')
            elif 'winnative' in available_themes:
                style.theme_use('winnative')
        # On macOS, use 'aqua'
        elif self.system_type == "Darwin":
            if 'aqua' in available_themes:
                style.theme_use('aqua')
        # On Linux, use 'clam'
        else:
            if 'clam' in available_themes:
                style.theme_use('clam')

        # Configure dark style
        style.configure('TFrame', background='#2b2b2b')
        style.configure('TLabel', background='#2b2b2b', foreground='#ffffff')
        style.configure('TLabelframe', background='#2b2b2b', foreground='#ffffff')
        style.configure('TLabelframe.Label', background='#2b2b2b', foreground='#ffffff')
        style.configure('TEntry', fieldbackground='#3c3c3c', foreground='#ffffff')

        # Configure button style (use dark background and dark text for readability)
        style.configure('TButton',
                       background='#4a90e2',  # Blue background
                       foreground='#000000',  # Black text
                       borderwidth=1,
                       focuscolor='none',
                       relief='raised')

        # Button hover and pressed states
        style.map('TButton',
                 background=[('active', '#357abd'), ('pressed', '#2868a8')],
                 foreground=[('active', '#000000'), ('pressed', '#000000')])

        # Configure scrollbar
        style.configure('Vertical.TScrollbar', background='#3c3c3c', troughcolor='#2b2b2b')

    def get_system_sounds(self):
        """Get sound list based on system type"""
        if self.system_type == "Darwin":  # macOS
            return self.get_macos_sounds()
        elif self.system_type == "Windows":
            return self.get_windows_sounds()
        else:
            return []

    def get_macos_sounds(self):
        """Get macOS system sound list"""
        sound_path = "/System/Library/Sounds"
        sounds = []

        # macOS system sound list
        sound_names = [
            "Basso", "Blow", "Bottle", "Frog", "Funk",
            "Glass", "Hero", "Morse", "Ping", "Pop",
            "Purr", "Sosumi", "Submarine", "Tink"
        ]

        for name in sound_names:
            file_path = f"{sound_path}/{name}.aiff"
            exists = os.path.exists(file_path)
            sounds.append({
                "display_name": name,
                "file_name": f"{name}.aiff",
                "file_path": file_path,
                "exists": exists,
                "category": "System Sounds"
            })

        return sounds

    def get_windows_sounds(self):
        """Get Windows system sound list"""
        sound_path = r"C:\Windows\Media"
        sounds = []

        # Windows system sound categories
        sound_categories = {
            "Core System Sounds": [
                ("Logon", "Windows Logon.wav"),
                ("Logoff", "Windows Logoff Sound.wav"),
                ("Unlock", "Windows Unlock.wav"),
                ("Background", "Windows Background.wav"),
                ("Foreground", "Windows Foreground.wav"),
            ],
            "Notification Sounds": [
                ("System Notification", "Windows Notify System Generic.wav"),
                ("Email Notification", "Windows Notify Email.wav"),
                ("Calendar Notification", "Windows Notify Calendar.wav"),
                ("Message Notification", "Windows Notify Messaging.wav"),
                ("Balloon Notification", "Windows Balloon.wav"),
            ],
            "System Event Sounds": [
                ("Critical Stop", "Windows Critical Stop.wav"),
                ("Error", "Windows Error.wav"),
                ("Exclamation", "Windows Exclamation.wav"),
                ("Default Sound", "Windows Default.wav"),
                ("Ding", "Windows Ding.wav"),
                ("UAC Prompt", "Windows User Account Control.wav"),
            ],
            "Hardware Sounds": [
                ("Hardware Insert", "Windows Hardware Insert.wav"),
                ("Hardware Remove", "Windows Hardware Remove.wav"),
                ("Hardware Fail", "Windows Hardware Fail.wav"),
            ],
            "Window Operations": [
                ("Minimize", "Windows Minimize.wav"),
                ("Restore", "Windows Restore.wav"),
                ("Print Complete", "Windows Print complete.wav"),
            ],
            "Classic Sounds": [
                ("Tada", "tada.wav"),
                ("Chimes", "chimes.wav"),
                ("Chord", "chord.wav"),
                ("Ding", "ding.wav"),
                ("Notify", "notify.wav"),
                ("Recycle", "recycle.wav"),
                ("Ringout", "ringout.wav"),
            ],
            "Alarm Sounds": [
                ("Alarm 01", "Alarm01.wav"),
                ("Alarm 02", "Alarm02.wav"),
                ("Alarm 03", "Alarm03.wav"),
                ("Alarm 04", "Alarm04.wav"),
                ("Alarm 05", "Alarm05.wav"),
                ("Alarm 06", "Alarm06.wav"),
                ("Alarm 07", "Alarm07.wav"),
                ("Alarm 08", "Alarm08.wav"),
                ("Alarm 09", "Alarm09.wav"),
                ("Alarm 10", "Alarm10.wav"),
            ],
            "Ringtones": [
                ("Ring 01", "Ring01.wav"),
                ("Ring 02", "Ring02.wav"),
                ("Ring 03", "Ring03.wav"),
                ("Ring 04", "Ring04.wav"),
                ("Ring 05", "Ring05.wav"),
                ("Ring 06", "Ring06.wav"),
                ("Ring 07", "Ring07.wav"),
                ("Ring 08", "Ring08.wav"),
                ("Ring 09", "Ring09.wav"),
                ("Ring 10", "Ring10.wav"),
            ],
        }

        for category, sound_list in sound_categories.items():
            for display_name, file_name in sound_list:
                file_path = os.path.join(sound_path, file_name)
                exists = os.path.exists(file_path)
                sounds.append({
                    "display_name": display_name,
                    "file_name": file_name,
                    "file_path": file_path,
                    "exists": exists,
                    "category": category
                })

        return sounds

    def create_widgets(self):
        """Create GUI components"""
        # Top playback info display box
        playback_frame = ttk.LabelFrame(self.root, text="Current Playback Info", padding="10")
        playback_frame.pack(fill=tk.X, padx=10, pady=(10, 5))

        # Create read-only text box for displaying playback info
        self.playback_text = tk.Text(
            playback_frame,
            height=3,
            wrap=tk.WORD,
            bg='#3c3c3c',
            fg='#ffffff',
            font=("Arial", 10),
            relief=tk.FLAT,
            padx=10,
            pady=5
        )
        self.playback_text.pack(fill=tk.X)

        # Set initial text
        self.playback_text.insert("1.0", "Waiting to play...\nSound Name: -\nFile Path: -")
        self.playback_text.config(state=tk.NORMAL)  # Allow selection and copying

        # Top info bar
        info_frame = ttk.Frame(self.root, padding="10")
        info_frame.pack(fill=tk.X)

        system_label = ttk.Label(
            info_frame,
            text=f"System Type: {self.system_type}",
            font=("Arial", 12, "bold")
        )
        system_label.pack(anchor=tk.W)

        if self.sounds:
            path_label = ttk.Label(
                info_frame,
                text=f"Sound Path: {os.path.dirname(self.sounds[0]['file_path'])}",
                font=("Arial", 10)
            )
            path_label.pack(anchor=tk.W)

        count_label = ttk.Label(
            info_frame,
            text=f"Found {len(self.sounds)} sound files",
            font=("Arial", 10)
        )
        count_label.pack(anchor=tk.W)

        # Separator
        ttk.Separator(self.root, orient=tk.HORIZONTAL).pack(fill=tk.X, pady=5)

        # Create main container frame
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)

        # Create Canvas and scrollbar
        canvas = tk.Canvas(main_frame, bg='#2b2b2b', highlightthickness=0)
        scrollbar = ttk.Scrollbar(main_frame, orient=tk.VERTICAL, command=canvas.yview)
        scrollable_frame = ttk.Frame(canvas)

        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )

        canvas.create_window((0, 0), window=scrollable_frame, anchor=tk.NW)
        canvas.configure(yscrollcommand=scrollbar.set)

        # Layout Canvas and scrollbar
        canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        # Mouse wheel support
        def on_mousewheel(event):
            canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")

        canvas.bind_all("<MouseWheel>", on_mousewheel)

        # Display sounds grouped by category
        current_category = None
        for idx, sound in enumerate(self.sounds):
            # If new category, add category title
            if sound["category"] != current_category:
                current_category = sound["category"]
                category_frame = ttk.Frame(scrollable_frame)
                category_frame.pack(fill=tk.X, pady=(10, 5))

                category_label = ttk.Label(
                    category_frame,
                    text=f"━━ {current_category} ━━",
                    font=("Arial", 11, "bold"),
                    foreground="#0066cc"
                )
                category_label.pack(anchor=tk.W)

            # Create sound item frame
            sound_frame = ttk.Frame(scrollable_frame, relief=tk.RIDGE, borderwidth=1)
            sound_frame.pack(fill=tk.X, pady=2, padx=5)

            # Left info area
            info_frame = ttk.Frame(sound_frame)
            info_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10, pady=5)

            # Display name
            name_label = ttk.Label(
                info_frame,
                text=sound["display_name"],
                font=("Arial", 10, "bold")
            )
            name_label.pack(anchor=tk.W)

            # File name
            file_label = ttk.Label(
                info_frame,
                text=f"File: {sound['file_name']}",
                font=("Arial", 9),
                foreground="gray"
            )
            file_label.pack(anchor=tk.W)

            # Right button area
            button_frame = ttk.Frame(sound_frame)
            button_frame.pack(side=tk.RIGHT, padx=10, pady=5)

            # Status label
            status_label = ttk.Label(
                button_frame,
                text="",
                font=("Arial", 9),
                width=10
            )
            status_label.pack(side=tk.RIGHT, padx=5)

            # Play button
            if sound["exists"]:
                play_btn = ttk.Button(
                    button_frame,
                    text="▶ Play",
                    command=lambda s=sound, sl=status_label: self.play_sound(s, sl),
                    width=10
                )
                play_btn.pack(side=tk.RIGHT)
            else:
                missing_label = ttk.Label(
                    button_frame,
                    text="✗ File Not Found",
                    foreground="red",
                    font=("Arial", 9)
                )
                missing_label.pack(side=tk.RIGHT)

        # Custom playback area
        custom_frame = ttk.LabelFrame(self.root, text="Custom Sound File", padding="10")
        custom_frame.pack(fill=tk.X, padx=10, pady=5, side=tk.BOTTOM)

        # Input box and button container
        input_container = ttk.Frame(custom_frame)
        input_container.pack(fill=tk.X)

        # File name input box
        ttk.Label(input_container, text="Filename:").pack(side=tk.LEFT, padx=(0, 5))

        self.custom_filename_entry = ttk.Entry(input_container, width=40)
        self.custom_filename_entry.pack(side=tk.LEFT, padx=5)

        # Set default hint text based on system
        if self.system_type == "Darwin":
            self.custom_filename_entry.insert(0, "e.g.: Basso.aiff")
        else:
            self.custom_filename_entry.insert(0, "e.g.: tada.wav")

        # Play button
        custom_play_btn = ttk.Button(
            input_container,
            text="▶ Play Custom",
            command=self.play_custom_sound,
            width=15
        )
        custom_play_btn.pack(side=tk.LEFT, padx=5)

        # Custom playback status label
        self.custom_status_label = ttk.Label(
            input_container,
            text="",
            font=("Arial", 9),
            width=15
        )
        self.custom_status_label.pack(side=tk.LEFT, padx=5)

        # Path hint
        if self.system_type == "Darwin":
            path_hint = "/System/Library/Sounds/"
        else:
            path_hint = r"C:\Windows\Media" + "\\"

        hint_label = ttk.Label(
            custom_frame,
            text=f"Hint: Files will be loaded from {path_hint} directory",
            font=("Arial", 8),
            foreground="gray"
        )
        hint_label.pack(anchor=tk.W, pady=(5, 0))

        # Bottom status bar
        status_frame = ttk.Frame(self.root, relief=tk.SUNKEN, borderwidth=1)
        status_frame.pack(fill=tk.X, side=tk.BOTTOM)

        self.status_label = ttk.Label(
            status_frame,
            text="Ready",
            font=("Arial", 9),
            padding=5
        )
        self.status_label.pack(anchor=tk.W)

    def play_sound(self, sound, status_label):
        """Play sound (in new thread)"""
        if self.is_playing:
            self.update_status("Another sound is playing, please wait...")
            return

        # Play in new thread to avoid blocking GUI
        thread = threading.Thread(
            target=self._play_sound_thread,
            args=(sound, status_label)
        )
        thread.daemon = True
        thread.start()

    def play_custom_sound(self):
        """Play custom sound file"""
        if self.is_playing:
            self.update_status("Another sound is playing, please wait...")
            return

        # Get input filename
        filename = self.custom_filename_entry.get().strip()

        # Clear default hint text
        if filename.startswith("e.g.:"):
            self.custom_status_label.config(text="✗ Enter filename", foreground="red")
            return

        if not filename:
            self.custom_status_label.config(text="✗ Empty filename", foreground="red")
            return

        # Build full path
        if self.system_type == "Darwin":
            base_path = "/System/Library/Sounds"
            # If no extension, add .aiff by default
            if not filename.endswith(('.aiff', '.wav', '.mp3')):
                filename += '.aiff'
        else:
            base_path = r"C:\Windows\Media"
            # If no extension, add .wav by default
            if not filename.endswith(('.wav', '.mp3')):
                filename += '.wav'

        file_path = os.path.join(base_path, filename)

        # Check if file exists
        if not os.path.exists(file_path):
            self.custom_status_label.config(text="✗ File not found", foreground="red")
            self.update_status(f"File not found: {file_path}")
            return

        # Create temporary sound object
        custom_sound = {
            "display_name": f"Custom: {filename}",
            "file_name": filename,
            "file_path": file_path,
            "exists": True,
            "category": "Custom"
        }

        # Play in new thread
        thread = threading.Thread(
            target=self._play_sound_thread,
            args=(custom_sound, self.custom_status_label)
        )
        thread.daemon = True
        thread.start()

    def _play_sound_thread(self, sound, status_label):
        """Play sound in thread"""
        self.is_playing = True
        self.current_sound = sound["display_name"]

        # Update playback info display box
        self.root.after(0, lambda: self.update_playback_info(sound, "Playing"))

        # Update status
        self.root.after(0, lambda: status_label.config(text="▶ Playing...", foreground="green"))
        self.root.after(0, lambda: self.update_status(f"Playing: {sound['display_name']}"))

        try:
            if self.system_type == "Darwin":  # macOS
                subprocess.run(
                    ["afplay", sound["file_path"]],
                    check=True,
                    timeout=10
                )
            elif self.system_type == "Windows":
                # Windows uses winsound to play
                # SND_FILENAME: Interpret first parameter as filename
                # SND_NODEFAULT: Don't play default sound if not found
                winsound.PlaySound(
                    sound["file_path"],
                    winsound.SND_FILENAME
                )

            # Playback successful
            self.root.after(0, lambda: self.update_playback_info(sound, "Completed"))
            self.root.after(0, lambda: status_label.config(text="✓ Done", foreground="blue"))
            self.root.after(0, lambda: self.update_status(f"Completed: {sound['display_name']}"))

        except subprocess.TimeoutExpired:
            self.root.after(0, lambda: self.update_playback_info(sound, "Timeout"))
            self.root.after(0, lambda: status_label.config(text="✗ Timeout", foreground="red"))
            self.root.after(0, lambda: self.update_status(f"Timeout: {sound['display_name']}"))

        except Exception as e:
            self.root.after(0, lambda: self.update_playback_info(sound, f"Failed: {str(e)}"))
            self.root.after(0, lambda: status_label.config(text="✗ Failed", foreground="red"))
            self.root.after(0, lambda: self.update_status(f"Failed: {str(e)}"))

        finally:
            # Clear status (delay 2 seconds)
            self.root.after(2000, lambda: status_label.config(text=""))
            self.is_playing = False
            self.current_sound = None

    def update_playback_info(self, sound, status):
        """Update playback info display box"""
        info_text = f"Status: {status}\n"
        info_text += f"Sound Name: {sound['display_name']}\n"
        info_text += f"File Path: {sound['file_path']}"

        self.playback_text.config(state=tk.NORMAL)
        self.playback_text.delete("1.0", tk.END)
        self.playback_text.insert("1.0", info_text)
        # Keep selectable state, don't set to DISABLED

    def update_status(self, message):
        """Update bottom status bar"""
        self.status_label.config(text=message)


def main():
    """Main function"""
    root = tk.Tk()
    app = SoundPlayerGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()