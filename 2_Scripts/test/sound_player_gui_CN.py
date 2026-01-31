#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
跨平台系统声音播放器 GUI
支持 macOS 和 Windows 系统声音播放
"""

import tkinter as tk
from tkinter import ttk, scrolledtext
import platform
import os
import subprocess
import threading
from pathlib import Path

# 检测是否在 Windows 系统
IS_WINDOWS = platform.system() == "Windows"
if IS_WINDOWS:
    import winsound


class SoundPlayerGUI:
    """系统声音播放器 GUI 类"""

    def __init__(self, root):
        self.root = root
        self.root.title("系统声音播放器")
        self.root.geometry("800x600")

        # 获取系统类型（必须在 setup_dark_theme 之前）
        self.system_type = platform.system()

        # 设置暗色主题（跨平台）
        self.setup_dark_theme()

        # 当前播放状态
        self.is_playing = False
        self.current_sound = None

        # 获取声音列表
        self.sounds = self.get_system_sounds()

        # 创建 GUI
        self.create_widgets()

    def setup_dark_theme(self):
        """设置暗色主题"""
        # 设置窗口背景色
        self.root.configure(bg='#2b2b2b')

        # 创建自定义样式
        style = ttk.Style()

        # 尝试使用暗色主题（如果可用）
        available_themes = style.theme_names()

        # Windows 上尝试使用 'vista' 或 'winnative'
        if self.system_type == "Windows":
            if 'vista' in available_themes:
                style.theme_use('vista')
            elif 'winnative' in available_themes:
                style.theme_use('winnative')
        # macOS 上使用 'aqua'
        elif self.system_type == "Darwin":
            if 'aqua' in available_themes:
                style.theme_use('aqua')
        # Linux 上使用 'clam'
        else:
            if 'clam' in available_themes:
                style.theme_use('clam')

        # 配置暗色样式
        style.configure('TFrame', background='#2b2b2b')
        style.configure('TLabel', background='#2b2b2b', foreground='#ffffff')
        style.configure('TLabelframe', background='#2b2b2b', foreground='#ffffff')
        style.configure('TLabelframe.Label', background='#2b2b2b', foreground='#ffffff')
        style.configure('TEntry', fieldbackground='#3c3c3c', foreground='#ffffff')

        # 配置按钮样式（使用深色背景和深色文字以确保可读性）
        style.configure('TButton',
                       background='#4a90e2',  # 蓝色背景
                       foreground='#000000',  # 黑色文字
                       borderwidth=1,
                       focuscolor='none',
                       relief='raised')

        # 按钮悬停和按下状态
        style.map('TButton',
                 background=[('active', '#357abd'), ('pressed', '#2868a8')],
                 foreground=[('active', '#000000'), ('pressed', '#000000')])

        # 配置滚动条
        style.configure('Vertical.TScrollbar', background='#3c3c3c', troughcolor='#2b2b2b')

    def get_system_sounds(self):
        """根据系统类型获取声音列表"""
        if self.system_type == "Darwin":  # macOS
            return self.get_macos_sounds()
        elif self.system_type == "Windows":
            return self.get_windows_sounds()
        else:
            return []

    def get_macos_sounds(self):
        """获取 macOS 系统声音列表"""
        sound_path = "/System/Library/Sounds"
        sounds = []

        # macOS 系统声音列表
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
                "category": "系统声音"
            })

        return sounds

    def get_windows_sounds(self):
        """获取 Windows 系统声音列表"""
        sound_path = r"C:\Windows\Media"
        sounds = []

        # Windows 系统声音分类
        sound_categories = {
            "核心系统声音": [
                ("登录音 (Logon)", "Windows Logon.wav"),
                ("注销音 (Logoff)", "Windows Logoff Sound.wav"),
                ("解锁音 (Unlock)", "Windows Unlock.wav"),
                ("背景音 (Background)", "Windows Background.wav"),
                ("前台音 (Foreground)", "Windows Foreground.wav"),
            ],
            "通知类声音": [
                ("系统通知", "Windows Notify System Generic.wav"),
                ("邮件通知", "Windows Notify Email.wav"),
                ("日历通知", "Windows Notify Calendar.wav"),
                ("消息通知", "Windows Notify Messaging.wav"),
                ("气泡通知", "Windows Balloon.wav"),
            ],
            "系统事件声音": [
                ("严重错误", "Windows Critical Stop.wav"),
                ("错误", "Windows Error.wav"),
                ("警告", "Windows Exclamation.wav"),
                ("默认声音", "Windows Default.wav"),
                ("叮声", "Windows Ding.wav"),
                ("UAC 提示音", "Windows User Account Control.wav"),
            ],
            "硬件相关": [
                ("硬件插入", "Windows Hardware Insert.wav"),
                ("硬件移除", "Windows Hardware Remove.wav"),
                ("硬件故障", "Windows Hardware Fail.wav"),
            ],
            "窗口操作": [
                ("最小化", "Windows Minimize.wav"),
                ("还原", "Windows Restore.wav"),
                ("打印完成", "Windows Print complete.wav"),
            ],
            "经典声音": [
                ("Tada (完成音)", "tada.wav"),
                ("Chimes (铃声)", "chimes.wav"),
                ("Chord (和弦)", "chord.wav"),
                ("Ding (叮)", "ding.wav"),
                ("Notify (通知)", "notify.wav"),
                ("Recycle (回收站)", "recycle.wav"),
                ("Ringout (铃声)", "ringout.wav"),
            ],
            "闹钟声音": [
                ("闹钟 01", "Alarm01.wav"),
                ("闹钟 02", "Alarm02.wav"),
                ("闹钟 03", "Alarm03.wav"),
                ("闹钟 04", "Alarm04.wav"),
                ("闹钟 05", "Alarm05.wav"),
                ("闹钟 06", "Alarm06.wav"),
                ("闹钟 07", "Alarm07.wav"),
                ("闹钟 08", "Alarm08.wav"),
                ("闹钟 09", "Alarm09.wav"),
                ("闹钟 10", "Alarm10.wav"),
            ],
            "铃声": [
                ("铃声 01", "Ring01.wav"),
                ("铃声 02", "Ring02.wav"),
                ("铃声 03", "Ring03.wav"),
                ("铃声 04", "Ring04.wav"),
                ("铃声 05", "Ring05.wav"),
                ("铃声 06", "Ring06.wav"),
                ("铃声 07", "Ring07.wav"),
                ("铃声 08", "Ring08.wav"),
                ("铃声 09", "Ring09.wav"),
                ("铃声 10", "Ring10.wav"),
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
        """创建 GUI 组件"""
        # 顶部播放信息显示框
        playback_frame = ttk.LabelFrame(self.root, text="当前播放信息", padding="10")
        playback_frame.pack(fill=tk.X, padx=10, pady=(10, 5))

        # 创建只读文本框用于显示播放信息
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

        # 设置初始文本
        self.playback_text.insert("1.0", "等待播放...\n声音名称: -\n文件路径: -")
        self.playback_text.config(state=tk.NORMAL)  # 允许选择和复制

        # 顶部信息栏
        info_frame = ttk.Frame(self.root, padding="10")
        info_frame.pack(fill=tk.X)

        system_label = ttk.Label(
            info_frame,
            text=f"系统类型: {self.system_type}",
            font=("Arial", 12, "bold")
        )
        system_label.pack(anchor=tk.W)

        if self.sounds:
            path_label = ttk.Label(
                info_frame,
                text=f"声音路径: {os.path.dirname(self.sounds[0]['file_path'])}",
                font=("Arial", 10)
            )
            path_label.pack(anchor=tk.W)

        count_label = ttk.Label(
            info_frame,
            text=f"共找到 {len(self.sounds)} 个声音文件",
            font=("Arial", 10)
        )
        count_label.pack(anchor=tk.W)

        # 分隔线
        ttk.Separator(self.root, orient=tk.HORIZONTAL).pack(fill=tk.X, pady=5)

        # 创建主容器框架
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)

        # 创建 Canvas 和滚动条
        canvas = tk.Canvas(main_frame, bg='#2b2b2b', highlightthickness=0)
        scrollbar = ttk.Scrollbar(main_frame, orient=tk.VERTICAL, command=canvas.yview)
        scrollable_frame = ttk.Frame(canvas)

        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )

        canvas.create_window((0, 0), window=scrollable_frame, anchor=tk.NW)
        canvas.configure(yscrollcommand=scrollbar.set)

        # 布局 Canvas 和滚动条
        canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        # 鼠标滚轮支持
        def on_mousewheel(event):
            canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")

        canvas.bind_all("<MouseWheel>", on_mousewheel)

        # 按类别分组显示声音
        current_category = None
        for idx, sound in enumerate(self.sounds):
            # 如果是新类别，添加类别标题
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

            # 创建声音项框架
            sound_frame = ttk.Frame(scrollable_frame, relief=tk.RIDGE, borderwidth=1)
            sound_frame.pack(fill=tk.X, pady=2, padx=5)

            # 左侧信息区域
            info_frame = ttk.Frame(sound_frame)
            info_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10, pady=5)

            # 显示名称
            name_label = ttk.Label(
                info_frame,
                text=sound["display_name"],
                font=("Arial", 10, "bold")
            )
            name_label.pack(anchor=tk.W)

            # 文件名
            file_label = ttk.Label(
                info_frame,
                text=f"文件: {sound['file_name']}",
                font=("Arial", 9),
                foreground="gray"
            )
            file_label.pack(anchor=tk.W)

            # 右侧按钮区域
            button_frame = ttk.Frame(sound_frame)
            button_frame.pack(side=tk.RIGHT, padx=10, pady=5)

            # 状态标签
            status_label = ttk.Label(
                button_frame,
                text="",
                font=("Arial", 9),
                width=10
            )
            status_label.pack(side=tk.RIGHT, padx=5)

            # 播放按钮
            if sound["exists"]:
                play_btn = ttk.Button(
                    button_frame,
                    text="▶ 播放",
                    command=lambda s=sound, sl=status_label: self.play_sound(s, sl),
                    width=10
                )
                play_btn.pack(side=tk.RIGHT)
            else:
                missing_label = ttk.Label(
                    button_frame,
                    text="✗ 文件不存在",
                    foreground="red",
                    font=("Arial", 9)
                )
                missing_label.pack(side=tk.RIGHT)

        # 自定义播放区域
        custom_frame = ttk.LabelFrame(self.root, text="自定义声音文件", padding="10")
        custom_frame.pack(fill=tk.X, padx=10, pady=5, side=tk.BOTTOM)

        # 输入框和按钮的容器
        input_container = ttk.Frame(custom_frame)
        input_container.pack(fill=tk.X)

        # 文件名输入框
        ttk.Label(input_container, text="文件名:").pack(side=tk.LEFT, padx=(0, 5))

        self.custom_filename_entry = ttk.Entry(input_container, width=40)
        self.custom_filename_entry.pack(side=tk.LEFT, padx=5)

        # 根据系统设置默认提示文本
        if self.system_type == "Darwin":
            self.custom_filename_entry.insert(0, "例如: Basso.aiff")
        else:
            self.custom_filename_entry.insert(0, "例如: tada.wav")

        # 播放按钮
        custom_play_btn = ttk.Button(
            input_container,
            text="▶ 播放自定义",
            command=self.play_custom_sound,
            width=15
        )
        custom_play_btn.pack(side=tk.LEFT, padx=5)

        # 自定义播放状态标签
        self.custom_status_label = ttk.Label(
            input_container,
            text="",
            font=("Arial", 9),
            width=15
        )
        self.custom_status_label.pack(side=tk.LEFT, padx=5)

        # 路径提示
        if self.system_type == "Darwin":
            path_hint = "/System/Library/Sounds/"
        else:
            path_hint = r"C:\Windows\Media" + "\\"

        hint_label = ttk.Label(
            custom_frame,
            text=f"提示: 文件将从 {path_hint} 目录加载",
            font=("Arial", 8),
            foreground="gray"
        )
        hint_label.pack(anchor=tk.W, pady=(5, 0))

        # 底部状态栏
        status_frame = ttk.Frame(self.root, relief=tk.SUNKEN, borderwidth=1)
        status_frame.pack(fill=tk.X, side=tk.BOTTOM)

        self.status_label = ttk.Label(
            status_frame,
            text="就绪",
            font=("Arial", 9),
            padding=5
        )
        self.status_label.pack(anchor=tk.W)

    def play_sound(self, sound, status_label):
        """播放声音（在新线程中）"""
        if self.is_playing:
            self.update_status("正在播放其他声音，请稍候...")
            return

        # 在新线程中播放，避免阻塞 GUI
        thread = threading.Thread(
            target=self._play_sound_thread,
            args=(sound, status_label)
        )
        thread.daemon = True
        thread.start()

    def play_custom_sound(self):
        """播放自定义声音文件"""
        if self.is_playing:
            self.update_status("正在播放其他声音，请稍候...")
            return

        # 获取输入的文件名
        filename = self.custom_filename_entry.get().strip()

        # 清除默认提示文本
        if filename.startswith("例如:"):
            self.custom_status_label.config(text="✗ 请输入文件名", foreground="red")
            return

        if not filename:
            self.custom_status_label.config(text="✗ 文件名为空", foreground="red")
            return

        # 构建完整路径
        if self.system_type == "Darwin":
            base_path = "/System/Library/Sounds"
            # 如果没有扩展名，默认添加 .aiff
            if not filename.endswith(('.aiff', '.wav', '.mp3')):
                filename += '.aiff'
        else:
            base_path = r"C:\Windows\Media"
            # 如果没有扩展名，默认添加 .wav
            if not filename.endswith(('.wav', '.mp3')):
                filename += '.wav'

        file_path = os.path.join(base_path, filename)

        # 检查文件是否存在
        if not os.path.exists(file_path):
            self.custom_status_label.config(text="✗ 文件不存在", foreground="red")
            self.update_status(f"文件不存在: {file_path}")
            return

        # 创建临时声音对象
        custom_sound = {
            "display_name": f"自定义: {filename}",
            "file_name": filename,
            "file_path": file_path,
            "exists": True,
            "category": "自定义"
        }

        # 在新线程中播放
        thread = threading.Thread(
            target=self._play_sound_thread,
            args=(custom_sound, self.custom_status_label)
        )
        thread.daemon = True
        thread.start()

    def _play_sound_thread(self, sound, status_label):
        """在线程中播放声音"""
        self.is_playing = True
        self.current_sound = sound["display_name"]

        # 更新播放信息显示框
        self.root.after(0, lambda: self.update_playback_info(sound, "播放中"))

        # 更新状态
        self.root.after(0, lambda: status_label.config(text="▶ 播放中...", foreground="green"))
        self.root.after(0, lambda: self.update_status(f"正在播放: {sound['display_name']}"))

        try:
            if self.system_type == "Darwin":  # macOS
                subprocess.run(
                    ["afplay", sound["file_path"]],
                    check=True,
                    timeout=10
                )
            elif self.system_type == "Windows":
                # Windows 使用 winsound 播放
                # SND_FILENAME: 将第一个参数解释为文件名
                # SND_NODEFAULT: 如果找不到声音，不播放默认声音
                winsound.PlaySound(
                    sound["file_path"],
                    winsound.SND_FILENAME
                )

            # 播放成功
            self.root.after(0, lambda: self.update_playback_info(sound, "播放完成"))
            self.root.after(0, lambda: status_label.config(text="✓ 完成", foreground="blue"))
            self.root.after(0, lambda: self.update_status(f"播放完成: {sound['display_name']}"))

        except subprocess.TimeoutExpired:
            self.root.after(0, lambda: self.update_playback_info(sound, "播放超时"))
            self.root.after(0, lambda: status_label.config(text="✗ 超时", foreground="red"))
            self.root.after(0, lambda: self.update_status(f"播放超时: {sound['display_name']}"))

        except Exception as e:
            self.root.after(0, lambda: self.update_playback_info(sound, f"播放失败: {str(e)}"))
            self.root.after(0, lambda: status_label.config(text="✗ 失败", foreground="red"))
            self.root.after(0, lambda: self.update_status(f"播放失败: {str(e)}"))

        finally:
            # 清除状态（延迟 2 秒）
            self.root.after(2000, lambda: status_label.config(text=""))
            self.is_playing = False
            self.current_sound = None

    def update_playback_info(self, sound, status):
        """更新播放信息显示框"""
        info_text = f"状态: {status}\n"
        info_text += f"声音名称: {sound['display_name']}\n"
        info_text += f"文件路径: {sound['file_path']}"

        self.playback_text.config(state=tk.NORMAL)
        self.playback_text.delete("1.0", tk.END)
        self.playback_text.insert("1.0", info_text)
        # 保持可选择状态，不设置为 DISABLED

    def update_status(self, message):
        """更新底部状态栏"""
        self.status_label.config(text=message)


def main():
    """主函数"""
    root = tk.Tk()
    app = SoundPlayerGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()