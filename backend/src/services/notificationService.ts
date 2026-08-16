import nodemailer from 'nodemailer'
import config from '../config/index.js'

class NotificationService {
  private transporter: nodemailer.Transporter | null = null

  constructor() {
    this.initializeTransporter()
  }

  private initializeTransporter() {
    const { host, port, user, pass } = config.smtp

    if (!user || !pass) {
      console.warn('Email configuration incomplete, notifications via email will be disabled')
      return
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    })
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Email transporter not configured')
      return false
    }

    try {
      await this.transporter.sendMail({
        from: config.smtp.from,
        to,
        subject,
        html,
      })
      return true
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }

  async sendHotspotNotification(
    to: string,
    title: string,
    keyword: string,
    source: string,
    url: string
  ): Promise<boolean> {
    const subject = `🔥 热点提醒: ${title}`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); padding: 20px; border-radius: 8px; color: white;">
          <h2 style="margin: 0;">🔥 热点监控通知</h2>
        </div>
        
        <div style="padding: 20px; background: #f8f9fa; border-radius: 8px; margin-top: 10px;">
          <h3 style="margin-top: 0;">检测到关键词相关热点</h3>
          
          <p><strong>标题:</strong> ${title}</p>
          <p><strong>关键词:</strong> ${keyword}</p>
          <p><strong>数据源:</strong> ${source}</p>
          <p><strong>时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
          
          <a href="${url}" style="display: inline-block; padding: 10px 20px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            查看详情 →
          </a>
        </div>
        
        <div style="padding: 10px; text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
          <p>这是来自热点监控系统的自动通知，请勿直接回复。</p>
        </div>
      </div>
    `
    
    return this.sendEmail(to, subject, html)
  }

  // 发送浏览器通知（需要客户端支持）
  getWebNotificationPayload(
    title: string,
    keyword: string,
    source: string,
    url: string
  ): any {
    return {
      title: `🔥 ${title}`,
      options: {
        body: `关键词: ${keyword} | 来源: ${source}`,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%238b5cf6"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23fff"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>',
        tag: `hotspot-${Date.now()}`,
        requireInteraction: false,
        actions: [
          {
            action: 'open',
            title: '打开链接',
          },
          {
            action: 'dismiss',
            title: '关闭',
          },
        ],
        data: {
          url,
          keyword,
          source,
        },
      },
    }
  }
}

export const notificationService = new NotificationService()
