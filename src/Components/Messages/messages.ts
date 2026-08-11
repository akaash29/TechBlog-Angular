import { Component, DestroyRef, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../app/services/auth.service';
import { UserService } from '../../app/services/user.service';
import { MessageService } from '../../app/services/message.service';
import { RealtimeService } from '../../app/services/realtime.service';
import { MessagesBadgeService } from '../../app/services/messages-badge.service';
import { ToastService } from '../../app/shared/toast.service';
import { UserProfile } from '../../app/models/auth.models';
import {
  ALLOWED_MESSAGE_FILE_TYPES,
  Conversation,
  MAX_MESSAGE_ATTACHMENT_SIZE_BYTES,
  Message,
} from '../../app/models/message.models';

type ConvoFilter = 'all' | 'unread';

/** Real data + a live SignalR connection end to end: MessageService talks to
 *  /api/messages (REST — send/history/read), and RealtimeService's shared
 *  hub connection (started from Navbar) pushes new messages and read
 *  receipts in as they happen. Attachments and voice notes upload to blob
 *  storage first (see MessageService.uploadAttachment), then the resulting
 *  URL rides along in the message itself. */
@Component({
  selector: 'app-messages',
  imports: [FormsModule, DatePipe, RouterLink],
  templateUrl: './messages.html',
  styleUrl: './messages.css',
})
export class Messages {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);
  private readonly realtimeService = inject(RealtimeService);
  private readonly messagesBadgeService = inject(MessagesBadgeService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly currentUserId = computed(() => this.authService.currentUser()?.id ?? null);
  protected readonly onlineUserIds = this.realtimeService.onlineUserIds;

  protected readonly conversations = signal<Conversation[]>([]);
  protected readonly loadingConversations = signal(true);
  protected readonly filter = signal<ConvoFilter>('all');
  protected readonly searchTerm = signal('');

  protected readonly filteredConversations = computed(() => {
    const filter = this.filter();
    const term = this.searchTerm().trim().toLowerCase();
    return this.conversations().filter((c) => {
      if (filter === 'unread' && c.unreadCount === 0) return false;
      if (term && !`${c.otherUserName} ${c.lastMessagePreview ?? ''}`.toLowerCase().includes(term)) return false;
      return true;
    });
  });

  protected readonly currentThreadUserId = signal<string | null>(null);
  protected readonly currentThreadUser = computed(
    () => this.conversations().find((c) => c.otherUserId === this.currentThreadUserId()) ?? null
  );
  protected readonly messages = signal<Message[]>([]);
  protected readonly loadingThread = signal(false);
  protected readonly showThreadOnMobile = signal(false);

  protected readonly messageText = signal('');
  protected readonly sending = signal(false);

  protected readonly sharedAttachments = computed(() =>
    this.messages().filter((m) => m.attachmentUrl && m.attachmentFileName)
  );

  // "New conversation" popover
  protected readonly showNewChat = signal(false);
  protected readonly newChatSearch = signal('');
  protected readonly newChatResults = signal<UserProfile[]>([]);
  protected readonly searchingNewChat = signal(false);

  // Attach-file dialog
  protected readonly showAttachDialog = signal(false);
  protected readonly attachSelectedFile = signal<File | null>(null);
  protected readonly attachError = signal<string | null>(null);
  protected readonly uploadingAttachment = signal(false);
  protected readonly maxAttachmentSizeLabel = `${MAX_MESSAGE_ATTACHMENT_SIZE_BYTES / 1024 / 1024} MB`;

  // Voice-recorder dialog
  protected readonly showVoiceDialog = signal(false);
  protected readonly recording = signal(false);
  protected readonly recordedBlob = signal<Blob | null>(null);
  /** A single object URL kept in step with recordedBlob — created once per
   *  recording and revoked on the way out, rather than minted fresh (and
   *  leaked) on every change-detection pass a `[src]="urlFor(blob)"` call
   *  in the template would cause. */
  protected readonly recordedBlobUrl = signal<string | null>(null);
  protected readonly recordingSeconds = signal(0);
  protected readonly uploadingVoice = signal(false);
  protected readonly voiceError = signal<string | null>(null);
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordingTimer: ReturnType<typeof setInterval> | null = null;
  private recordedMimeType = 'audio/webm';

  @ViewChild('scroller') private scrollerRef?: ElementRef<HTMLElement>;

  constructor() {
    this.loadConversations();

    const initialTo = this.route.snapshot.queryParamMap.get('to');
    if (initialTo) {
      this.openThread(initialTo);
    }

    this.realtimeService.messageReceived$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((message) => {
      const otherId = message.senderId === this.currentUserId() ? message.recipientId : message.senderId;
      if (this.currentThreadUserId() === otherId) {
        this.messages.update((list) => [...list, message]);
        this.scrollToBottomSoon();
        if (message.recipientId === this.currentUserId()) {
          this.messageService.markThreadRead(otherId).subscribe();
        }
      }
      this.loadConversations();
    });

    this.realtimeService.threadRead$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((readerId) => {
      if (this.currentThreadUserId() !== readerId) return;
      this.messages.update((list) => list.map((m) => (m.recipientId === readerId ? { ...m, isRead: true } : m)));
    });
  }

  protected selectFilter(filter: ConvoFilter): void {
    this.filter.set(filter);
  }

  protected openThread(otherUserId: string): void {
    this.currentThreadUserId.set(otherUserId);
    this.showThreadOnMobile.set(true);
    this.loadingThread.set(true);
    this.messages.set([]);

    this.messageService.getThread(otherUserId).subscribe({
      next: (messages) => {
        this.messages.set(messages);
        this.loadingThread.set(false);
        this.scrollToBottomSoon();
      },
      error: (err) => {
        console.error('Failed to load conversation:', err);
        this.loadingThread.set(false);
      },
    });

    const conversation = this.conversations().find((c) => c.otherUserId === otherUserId);
    if (conversation && conversation.unreadCount > 0) {
      this.messageService.markThreadRead(otherUserId).subscribe(() => {
        this.conversations.update((list) =>
          list.map((c) => (c.otherUserId === otherUserId ? { ...c, unreadCount: 0 } : c))
        );
        this.syncBadgeFromConversations();
      });
    }
  }

  protected backToList(): void {
    this.showThreadOnMobile.set(false);
  }

  protected isOnline(userId: string): boolean {
    return this.onlineUserIds().has(userId);
  }

  protected onComposerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendText();
    }
  }

  protected sendText(): void {
    const text = this.messageText().trim();
    const recipientId = this.currentThreadUserId();
    if (!text || !recipientId || this.sending()) return;

    this.sending.set(true);
    this.messageService.send({ RecipientId: recipientId, Text: text }).subscribe({
      next: (message) => {
        this.messages.update((list) => [...list, message]);
        this.messageText.set('');
        this.sending.set(false);
        this.scrollToBottomSoon();
        this.loadConversations();
      },
      error: (err) => {
        console.error('Failed to send message:', err);
        this.sending.set(false);
      },
    });
  }

  // ---------- new conversation ----------

  protected openNewChat(): void {
    this.showNewChat.set(true);
    this.newChatSearch.set('');
    this.newChatResults.set([]);
  }

  protected closeNewChat(): void {
    this.showNewChat.set(false);
  }

  protected onNewChatSearch(term: string): void {
    this.newChatSearch.set(term);
    if (!term.trim()) {
      this.newChatResults.set([]);
      return;
    }
    this.searchingNewChat.set(true);
    this.userService.getPaged(1, 10, null, term.trim()).subscribe({
      next: (result) => {
        this.newChatResults.set(result.items.filter((u) => u.id !== this.currentUserId()));
        this.searchingNewChat.set(false);
      },
      error: (err) => {
        console.error('Search failed:', err);
        this.searchingNewChat.set(false);
      },
    });
  }

  protected startConversationWith(user: UserProfile): void {
    this.showNewChat.set(false);

    // currentThreadUser (which the thread pane and composer render off of)
    // is looked up from conversations() — with no prior messages there's no
    // entry for this person yet, so without seeding one here the lookup
    // comes back null and the thread pane silently never appears. Sending
    // the first real message replaces this via the loadConversations()
    // refresh that follows it.
    if (!this.conversations().some((c) => c.otherUserId === user.id)) {
      this.conversations.update((list) => [
        {
          otherUserId: user.id,
          otherUserName: `${user.firstName} ${user.lastName}`,
          otherUserProfileImagePath: user.profileImagePath,
          lastMessagePreview: null,
          lastMessageAt: new Date().toISOString(),
          lastMessageIsMine: false,
          unreadCount: 0,
          isOnline: this.isOnline(user.id),
        },
        ...list,
      ]);
    }

    this.openThread(user.id);
  }

  // ---------- file attachment ----------

  protected openAttachDialog(): void {
    this.showAttachDialog.set(true);
    this.attachSelectedFile.set(null);
    this.attachError.set(null);
  }

  protected closeAttachDialog(): void {
    if (this.uploadingAttachment()) return;
    this.showAttachDialog.set(false);
  }

  protected onAttachFileChosen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    this.validateAndSetAttachment(file);
  }

  protected onAttachFileDropped(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0] ?? null;
    this.validateAndSetAttachment(file);
  }

  private validateAndSetAttachment(file: File | null): void {
    this.attachError.set(null);
    if (!file) {
      this.attachSelectedFile.set(null);
      return;
    }
    if (!ALLOWED_MESSAGE_FILE_TYPES.includes(file.type)) {
      this.attachError.set('That file type isn’t supported.');
      this.attachSelectedFile.set(null);
      return;
    }
    if (file.size > MAX_MESSAGE_ATTACHMENT_SIZE_BYTES) {
      this.attachError.set(`That file is too large — the limit is ${this.maxAttachmentSizeLabel}.`);
      this.attachSelectedFile.set(null);
      return;
    }
    this.attachSelectedFile.set(file);
  }

  protected sendAttachment(): void {
    const file = this.attachSelectedFile();
    const recipientId = this.currentThreadUserId();
    if (!file || !recipientId || this.uploadingAttachment()) return;

    this.uploadingAttachment.set(true);
    this.messageService.uploadAttachment(recipientId, file, 'file').subscribe({
      next: (uploaded) => {
        this.messageService
          .send({
            RecipientId: recipientId,
            AttachmentUrl: uploaded.url,
            AttachmentFileName: uploaded.fileName,
            AttachmentContentType: uploaded.contentType,
            AttachmentSizeBytes: uploaded.sizeBytes,
          })
          .subscribe({
            next: (message) => {
              this.messages.update((list) => [...list, message]);
              this.uploadingAttachment.set(false);
              this.showAttachDialog.set(false);
              this.scrollToBottomSoon();
              this.loadConversations();
            },
            error: (err) => {
              console.error('Failed to send attachment:', err);
              this.uploadingAttachment.set(false);
            },
          });
      },
      error: (err) => {
        console.error('Attachment upload failed:', err);
        this.uploadingAttachment.set(false);
        this.attachError.set('Upload failed. Try again.');
      },
    });
  }

  // ---------- voice notes ----------

  protected async openVoiceDialog(): Promise<void> {
    this.showVoiceDialog.set(true);
    this.setRecordedBlob(null);
    this.recordingSeconds.set(0);
    this.voiceError.set(null);
  }

  protected closeVoiceDialog(): void {
    if (this.uploadingVoice()) return;
    this.stopRecordingInternal();
    this.showVoiceDialog.set(false);
    this.setRecordedBlob(null);
  }

  protected async startRecording(): Promise<void> {
    this.voiceError.set(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.recordedChunks = [];
      const recorder = new MediaRecorder(stream);
      this.recordedMimeType = recorder.mimeType || 'audio/webm';
      this.mediaRecorder = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(this.recordedChunks, { type: this.recordedMimeType });
        this.setRecordedBlob(blob);
      };

      recorder.start();
      this.recording.set(true);
      this.recordingSeconds.set(0);
      this.recordingTimer = setInterval(() => this.recordingSeconds.update((s) => s + 1), 1000);
    } catch (err) {
      console.error('Microphone access failed:', err);
      this.voiceError.set('Couldn’t access the microphone. Check your browser’s permissions.');
    }
  }

  protected stopRecording(): void {
    this.stopRecordingInternal();
  }

  private stopRecordingInternal(): void {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.recording.set(false);
  }

  protected discardRecording(): void {
    this.setRecordedBlob(null);
    this.recordingSeconds.set(0);
  }

  private setRecordedBlob(blob: Blob | null): void {
    const previousUrl = this.recordedBlobUrl();
    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
    }
    this.recordedBlob.set(blob);
    this.recordedBlobUrl.set(blob ? URL.createObjectURL(blob) : null);
  }

  protected sendVoiceNote(): void {
    const blob = this.recordedBlob();
    const recipientId = this.currentThreadUserId();
    if (!blob || !recipientId || this.uploadingVoice()) return;

    if (blob.size > MAX_MESSAGE_ATTACHMENT_SIZE_BYTES) {
      this.voiceError.set(`That recording is too long — the limit is ${this.maxAttachmentSizeLabel}.`);
      return;
    }

    const extension = this.recordedMimeType.includes('ogg') ? 'ogg' : 'webm';
    const file = new File([blob], `voice-note.${extension}`, { type: this.recordedMimeType });
    const durationSeconds = this.recordingSeconds();

    this.uploadingVoice.set(true);
    this.messageService.uploadAttachment(recipientId, file, 'voice').subscribe({
      next: (uploaded) => {
        this.messageService
          .send({
            RecipientId: recipientId,
            VoiceNoteUrl: uploaded.url,
            VoiceNoteDurationSeconds: durationSeconds,
          })
          .subscribe({
            next: (message) => {
              this.messages.update((list) => [...list, message]);
              this.uploadingVoice.set(false);
              this.showVoiceDialog.set(false);
              this.recordedBlob.set(null);
              this.scrollToBottomSoon();
              this.loadConversations();
            },
            error: (err) => {
              console.error('Failed to send voice note:', err);
              this.uploadingVoice.set(false);
            },
          });
      },
      error: (err) => {
        console.error('Voice note upload failed:', err);
        this.uploadingVoice.set(false);
        this.voiceError.set('Upload failed. Try again.');
      },
    });
  }

  // ---------- helpers ----------

  protected initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  protected formatDuration(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  protected formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  private loadConversations(): void {
    this.messageService.getConversations().subscribe({
      next: (conversations) => {
        this.conversations.set(conversations);
        this.loadingConversations.set(false);
        this.syncBadgeFromConversations();
      },
      error: (err) => {
        console.error('Failed to load conversations:', err);
        this.loadingConversations.set(false);
      },
    });
  }

  /** Keeps the navbar's badge count derived from the same conversation data
   *  this page already has, rather than nudging a separate counter up/down
   *  — see MessagesBadgeService's doc comment for why. */
  private syncBadgeFromConversations(): void {
    const total = this.conversations().reduce((sum, c) => sum + c.unreadCount, 0);
    this.messagesBadgeService.setCount(total);
  }

  private scrollToBottomSoon(): void {
    setTimeout(() => {
      const el = this.scrollerRef?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
