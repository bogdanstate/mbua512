# Docker Setup for Local Mobile Testing

This Docker setup allows you to view the slides on your mobile device over your local network.

## Quick Start

1. **Start the server:**
   ```bash
   cd /home/bogdan/mbua512/dev
   docker-compose up -d
   ```

2. **Find your computer's local IP address:**
   ```bash
   # On Linux:
   ip addr show | grep "inet " | grep -v 127.0.0.1

   # Or simpler:
   hostname -I | awk '{print $1}'
   ```

3. **Access from your phone:**
   - Connect your phone to the same WiFi network as your computer
   - Open browser on your phone
   - Go to: `http://YOUR_IP_ADDRESS:8080`
   - For example: `http://192.168.1.100:8080`

4. **Navigate to specific presentations:**
   - Week 10: `http://YOUR_IP:8080/week-10/`
   - Week 9: `http://YOUR_IP:8080/week-9/`

5. **Stop the server:**
   ```bash
   docker-compose down
   ```

## Firewall Configuration

### Linux (Ubuntu/Debian with UFW)

If you can't access from mobile, you may need to allow port 8080:

```bash
# Allow port 8080
sudo ufw allow 8080/tcp

# Check firewall status
sudo ufw status
```

### Linux (Fedora/RHEL with firewalld)

```bash
# Allow port 8080
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload

# Check if port is open
sudo firewall-cmd --list-ports
```

### Router Configuration

**You typically DON'T need to configure your router** for local LAN access. Router port forwarding is only needed if you want to access from outside your home network (which is NOT recommended for security reasons).

The Docker setup uses `0.0.0.0:8080:8080` which binds to all network interfaces, making it accessible from:
- `localhost:8080` (your computer)
- `YOUR_LOCAL_IP:8080` (other devices on your LAN)

## Troubleshooting

### Can't access from phone?

1. **Check both devices are on the same WiFi:**
   - Phone and computer must be on the same network
   - Guest networks often block device-to-device communication

2. **Verify the server is running:**
   ```bash
   docker ps
   # Should show mbua512-slides container
   ```

3. **Test locally first:**
   ```bash
   curl http://localhost:8080
   # Should return HTML
   ```

4. **Check your firewall:**
   ```bash
   # See if port 8080 is listening on all interfaces
   sudo netstat -tlnp | grep 8080
   # Should show 0.0.0.0:8080
   ```

5. **Try your local IP from your computer:**
   ```bash
   # Get your IP
   MY_IP=$(hostname -I | awk '{print $1}')

   # Test from your computer's browser
   curl http://$MY_IP:8080
   ```

6. **Check if guest WiFi isolation is enabled:**
   - Some routers isolate WiFi clients from each other
   - Try disabling "AP Isolation" or "Client Isolation" in router settings
   - Or connect both devices to the main WiFi (not guest network)

### Port already in use?

If port 8080 is already taken, edit `docker-compose.yml` and change:
```yaml
ports:
  - "0.0.0.0:3000:8080"  # Use port 3000 instead
```

Then access via `http://YOUR_IP:3000`

## Live Updates

The Docker container mounts your dev directory as a volume, so any changes you make to the files will be immediately reflected when you refresh the page in your browser. No need to restart the container!

## Security Notes

- This setup is for **local development only**
- Do NOT expose this to the internet
- Only accessible on your local network (LAN)
- No authentication is configured
- Perfect for testing on mobile devices during development
