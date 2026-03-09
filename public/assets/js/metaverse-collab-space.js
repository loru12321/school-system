/**
 * 🌌 元宇宙虚拟教研室
 * 
 * 功能：
 * - 支持多名教师以虚拟化身进入同一个 3D 数据空间
 * - 沉浸式集体备课和数据分析
 * - 实时协作编辑和标注
 * - 虚拟白板和数据可视化
 * 
 * 依赖：无外部库（可选 Three.js 增强）
 * 
 * @author AI Education Team
 * @version 1.0.0
 */

const MetaverseCollabSpace = (() => {
    // 虚拟教研室状态
    let collabRooms = new Map();
    let activeUsers = new Map();
    let sharedData = new Map();
    let collabHistory = [];
    
    // 配置
    const config = {
        maxUsersPerRoom: 10,
        maxAnnotations: 1000,
        autoSaveInterval: 30000, // 30秒自动保存
        enableVoiceChat: true,
        enableScreenShare: true,
        avatarStyles: ['robot', 'human', 'abstract', 'animal']
    };
    
    /**
     * 创建虚拟教研室
     */
    function createCollabRoom(roomId, roomConfig = {}) {
        if (collabRooms.has(roomId)) {
            return collabRooms.get(roomId);
        }
        
        const room = {
            id: roomId,
            name: roomConfig.name || `教研室 ${roomId}`,
            createdAt: new Date(),
            users: new Map(),
            sharedCanvas: null,
            annotations: [],
            dataObjects: [],
            voiceChannels: new Map(),
            screenShares: new Map(),
            recordingEnabled: roomConfig.recordingEnabled || false,
            recordings: [],
            settings: {
                ...config,
                ...roomConfig
            }
        };
        
        collabRooms.set(roomId, room);
        console.log(`✅ 已创建虚拟教研室: ${room.name}`);
        
        return room;
    }
    
    /**
     * 用户进入教研室
     */
    function joinRoom(roomId, userId, userInfo = {}) {
        let room = collabRooms.get(roomId);
        if (!room) {
            room = createCollabRoom(roomId);
        }
        
        if (room.users.size >= room.settings.maxUsersPerRoom) {
            return { success: false, error: '教研室已满' };
        }
        
        const user = {
            id: userId,
            name: userInfo.name || `教师 ${userId}`,
            avatar: userInfo.avatar || `avatar_${Math.floor(Math.random() * 4)}`,
            joinedAt: new Date(),
            position: userInfo.position || { x: Math.random() * 100, y: Math.random() * 100 },
            isPresenting: false,
            isMuted: false,
            annotations: [],
            cursorPosition: { x: 0, y: 0 }
        };
        
        room.users.set(userId, user);
        activeUsers.set(userId, { roomId, user });
        
        console.log(`✅ ${user.name} 加入了教研室 ${room.name}`);
        
        return {
            success: true,
            room: room,
            user: user,
            otherUsers: Array.from(room.users.values()).filter(u => u.id !== userId)
        };
    }
    
    /**
     * 用户离开教研室
     */
    function leaveRoom(roomId, userId) {
        const room = collabRooms.get(roomId);
        if (!room) return false;
        
        const user = room.users.get(userId);
        if (!user) return false;
        
        room.users.delete(userId);
        activeUsers.delete(userId);
        
        // 如果教研室为空，删除房间
        if (room.users.size === 0) {
            collabRooms.delete(roomId);
        }
        
        console.log(`✅ ${user.name} 离开了教研室`);
        return true;
    }
    
    /**
     * 共享数据对象（图表、表格等）
     */
    function shareDataObject(roomId, dataObject) {
        const room = collabRooms.get(roomId);
        if (!room) return false;
        
        const sharedObj = {
            id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: dataObject.type, // 'chart', 'table', 'image', 'text'
            data: dataObject.data,
            position: dataObject.position || { x: 50, y: 50 },
            size: dataObject.size || { width: 300, height: 300 },
            createdBy: dataObject.createdBy,
            createdAt: new Date(),
            annotations: [],
            locked: false
        };
        
        room.dataObjects.push(sharedObj);
        sharedData.set(sharedObj.id, sharedObj);
        
        console.log(`✅ 已共享数据对象: ${sharedObj.type}`);
        
        return sharedObj;
    }
    
    /**
     * 添加标注（在数据对象上）
     */
    function addAnnotation(roomId, dataObjectId, annotation) {
        const room = collabRooms.get(roomId);
        if (!room) return false;
        
        const dataObj = room.dataObjects.find(obj => obj.id === dataObjectId);
        if (!dataObj) return false;
        
        if (room.annotations.length >= room.settings.maxAnnotations) {
            console.warn('⚠️ 标注数量已达上限');
            return false;
        }
        
        const annotationRecord = {
            id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            dataObjectId: dataObjectId,
            userId: annotation.userId,
            userName: annotation.userName,
            type: annotation.type, // 'text', 'highlight', 'arrow', 'circle'
            content: annotation.content,
            position: annotation.position,
            color: annotation.color || '#FF0000',
            createdAt: new Date(),
            resolved: false
        };
        
        room.annotations.push(annotationRecord);
        dataObj.annotations.push(annotationRecord.id);
        
        // 记录到历史
        collabHistory.push({
            type: 'annotation',
            roomId,
            user: annotation.userName,
            timestamp: new Date(),
            content: annotation.content
        });
        
        console.log(`✅ 已添加标注: ${annotation.type}`);
        
        return annotationRecord;
    }
    
    /**
     * 开始屏幕共享
     */
    function startScreenShare(roomId, userId, screenData) {
        const room = collabRooms.get(roomId);
        if (!room) return false;
        
        if (!room.settings.enableScreenShare) {
            return { success: false, error: '屏幕共享已禁用' };
        }
        
        const share = {
            id: `screen_${Date.now()}`,
            userId: userId,
            startedAt: new Date(),
            screenData: screenData,
            viewers: new Set()
        };
        
        room.screenShares.set(userId, share);
        
        console.log(`✅ ${userId} 开始屏幕共享`);
        
        return { success: true, shareId: share.id };
    }
    
    /**
     * 停止屏幕共享
     */
    function stopScreenShare(roomId, userId) {
        const room = collabRooms.get(roomId);
        if (!room) return false;
        
        room.screenShares.delete(userId);
        
        console.log(`✅ ${userId} 停止屏幕共享`);
        
        return true;
    }
    
    /**
     * 开始录制教研会议
     */
    function startRecording(roomId) {
        const room = collabRooms.get(roomId);
        if (!room) return false;
        
        const recording = {
            id: `rec_${Date.now()}`,
            startedAt: new Date(),
            events: [],
            status: 'recording'
        };
        
        room.recordings.push(recording);
        room.recordingEnabled = true;
        
        console.log(`✅ 已开始录制教研会议`);
        
        return recording;
    }
    
    /**
     * 停止录制
     */
    function stopRecording(roomId) {
        const room = collabRooms.get(roomId);
        if (!room) return false;
        
        const recording = room.recordings[room.recordings.length - 1];
        if (!recording) return false;
        
        recording.status = 'completed';
        recording.endedAt = new Date();
        recording.duration = recording.endedAt - recording.startedAt;
        
        room.recordingEnabled = false;
        
        console.log(`✅ 已停止录制，时长: ${Math.round(recording.duration / 1000)}秒`);
        
        return recording;
    }
    
    /**
     * 生成集体备课报告
     */
    function generateCollabReport(roomId) {
        const room = collabRooms.get(roomId);
        if (!room) return null;
        
        const report = {
            roomId: room.id,
            roomName: room.name,
            generatedAt: new Date(),
            duration: new Date() - room.createdAt,
            participants: Array.from(room.users.values()).map(u => ({
                name: u.name,
                joinedAt: u.joinedAt,
                annotationCount: u.annotations.length
            })),
            dataObjectsShared: room.dataObjects.length,
            annotationsCreated: room.annotations.length,
            recordingsCreated: room.recordings.length,
            keyDecisions: extractKeyDecisions(room),
            actionItems: extractActionItems(room)
        };
        
        return report;
    }
    
    /**
     * 提取关键决策
     */
    function extractKeyDecisions(room) {
        return room.annotations
            .filter(ann => ann.type === 'highlight' || ann.type === 'text')
            .slice(-10)
            .map(ann => ({
                content: ann.content,
                user: ann.userName,
                timestamp: ann.createdAt
            }));
    }
    
    /**
     * 提取行动项
     */
    function extractActionItems(room) {
        return room.annotations
            .filter(ann => ann.content && ann.content.includes('需要') || ann.content.includes('应该'))
            .map(ann => ({
                task: ann.content,
                assignedBy: ann.userName,
                createdAt: ann.createdAt,
                status: 'pending'
            }));
    }
    
    /**
     * 导出教研记录
     */
    function exportCollabRecord(roomId, format = 'json') {
        const room = collabRooms.get(roomId);
        if (!room) return null;
        
        const record = {
            room: {
                id: room.id,
                name: room.name,
                createdAt: room.createdAt
            },
            participants: Array.from(room.users.values()),
            dataObjects: room.dataObjects,
            annotations: room.annotations,
            recordings: room.recordings.map(r => ({
                id: r.id,
                duration: r.duration,
                startedAt: r.startedAt,
                endedAt: r.endedAt
            }))
        };
        
        if (format === 'json') {
            return JSON.stringify(record, null, 2);
        } else if (format === 'csv') {
            // 简单的 CSV 导出
            let csv = 'Type,User,Content,Timestamp\n';
            record.annotations.forEach(ann => {
                csv += `"${ann.type}","${ann.userName}","${ann.content}","${ann.createdAt}"\n`;
            });
            return csv;
        }
        
        return record;
    }
    
    // ==================== 公开 API ====================
    
    return {
        /**
         * 初始化元宇宙教研室系统
         */
        init(options = {}) {
            Object.assign(config, options);
            console.log('✅ 元宇宙虚拟教研室初始化成功');
            return true;
        },
        
        /**
         * 创建教研室
         */
        createRoom(roomId, roomConfig) {
            return createCollabRoom(roomId, roomConfig);
        },
        
        /**
         * 加入教研室
         */
        join(roomId, userId, userInfo) {
            return joinRoom(roomId, userId, userInfo);
        },
        
        /**
         * 离开教研室
         */
        leave(roomId, userId) {
            return leaveRoom(roomId, userId);
        },
        
        /**
         * 共享数据
         */
        shareData(roomId, dataObject) {
            return shareDataObject(roomId, dataObject);
        },
        
        /**
         * 添加标注
         */
        annotate(roomId, dataObjectId, annotation) {
            return addAnnotation(roomId, dataObjectId, annotation);
        },
        
        /**
         * 开始屏幕共享
         */
        startShare(roomId, userId, screenData) {
            return startScreenShare(roomId, userId, screenData);
        },
        
        /**
         * 停止屏幕共享
         */
        stopShare(roomId, userId) {
            return stopScreenShare(roomId, userId);
        },
        
        /**
         * 开始录制
         */
        record(roomId) {
            return startRecording(roomId);
        },
        
        /**
         * 停止录制
         */
        stopRecord(roomId) {
            return stopRecording(roomId);
        },
        
        /**
         * 生成报告
         */
        generateReport(roomId) {
            return generateCollabReport(roomId);
        },
        
        /**
         * 导出记录
         */
        export(roomId, format) {
            return exportCollabRecord(roomId, format);
        },
        
        /**
         * 获取教研室
         */
        getRoom(roomId) {
            return collabRooms.get(roomId);
        },
        
        /**
         * 获取所有教研室
         */
        getAllRooms() {
            return Array.from(collabRooms.values());
        },
        
        /**
         * 获取协作历史
         */
        getHistory() {
            return collabHistory;
        }
    };
})();

// 自动注册到全局
if (typeof window !== 'undefined') {
    window.MetaverseCollabSpace = MetaverseCollabSpace;
}
