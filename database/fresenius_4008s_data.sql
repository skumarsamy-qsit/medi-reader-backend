-- MSSQL Table Script for Fresenius 4008S Device Data Points
-- This script creates a flat table to store all data points from the Fresenius 4008S dialysis machine

CREATE TABLE [dbo].[Fresenius4008S_DataPoints] (
    [Id] [uniqueidentifier] NOT NULL DEFAULT NEWID(),
    [PatientId] [nvarchar](50) NOT NULL,
    [DeviceId] [nvarchar](50) NOT NULL,
    [SessionId] [nvarchar](50) NOT NULL,
    [Timestamp] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    [DeviceModel] [nvarchar](50) NOT NULL DEFAULT 'Fresenius 4008 S',
    [DeviceVersion] [nvarchar](20) NOT NULL DEFAULT '1.0',
    
    -- Original 4008S Data Points
    [KtV] [decimal](5,2) NULL,
    [PlasmaNA] [decimal](5,2) NULL,
    [GoalIn] [nvarchar](10) NULL, -- Format: h:mm
    [Clearance] [decimal](6,2) NULL,
    [UFVolume] [decimal](8,2) NULL,
    [UFTimeLeft] [nvarchar](10) NULL, -- Format: h:mm
    [UFRate] [decimal](6,2) NULL,
    [UFGoal] [decimal](8,2) NULL,
    [EffBloodFlow] [decimal](6,2) NULL,
    [CumBloodVol] [decimal](6,2) NULL,
    [BloodPressureSys] [decimal](5,2) NULL,
    [BloodPressureDia] [decimal](5,2) NULL,
    [BloodPressureMap] [decimal](5,2) NULL,
    [BloodPressurePulse] [decimal](5,2) NULL,
    [QB] [decimal](6,2) NULL,
    [Anticoagulant] [decimal](5,2) NULL,
    [ArterialPressure] [decimal](6,2) NULL,
    [VenousPressure] [decimal](6,2) NULL,
    [TMP] [decimal](6,2) NULL,
    [Conductivity] [decimal](5,2) NULL,
    
    -- New Data Points for Newer 4008S Versions (Dialysate Menu)
    [BPMSys] [decimal](5,2) NULL,
    [BPMDia] [decimal](5,2) NULL,
    [Dilution] [nvarchar](10) NULL, -- Format: 1+34
    [BaseNA] [decimal](5,2) NULL,
    [PrescribedNA] [decimal](5,2) NULL,
    [Bicarbonate] [decimal](5,2) NULL,
    [Temperature] [decimal](4,2) NULL,
    [DialysateFlow] [decimal](6,2) NULL,
    [NAProfile] [decimal](3,1) NULL,
    [StartNA] [decimal](5,2) NULL,
    [CDSStatus] [nvarchar](10) NULL,
    [EmptyBIBAG] [nvarchar](10) NULL,
    [ConductivityWindow] [decimal](5,2) NULL,
    
    -- Metadata
    [ImageUri] [nvarchar](500) NULL,
    [ProcessingTime] [decimal](8,2) NULL,
    [ModelUsed] [nvarchar](100) NULL,
    [ConfidenceScore] [decimal](3,2) NULL,
    [IsValidated] [bit] NOT NULL DEFAULT 0,
    [ValidationNotes] [nvarchar](500) NULL,
    [CreatedBy] [nvarchar](100) NULL,
    [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedBy] [nvarchar](100) NULL,
    [UpdatedAt] [datetime2](7) NULL,
    
    -- Audit fields
    [IsActive] [bit] NOT NULL DEFAULT 1,
    [IsDeleted] [bit] NOT NULL DEFAULT 0,
    
    CONSTRAINT [PK_Fresenius4008S_DataPoints] PRIMARY KEY CLUSTERED ([Id] ASC)
);

-- Create indexes for better performance
CREATE NONCLUSTERED INDEX [IX_Fresenius4008S_DataPoints_PatientId] 
ON [dbo].[Fresenius4008S_DataPoints] ([PatientId]);

CREATE NONCLUSTERED INDEX [IX_Fresenius4008S_DataPoints_DeviceId] 
ON [dbo].[Fresenius4008S_DataPoints] ([DeviceId]);

CREATE NONCLUSTERED INDEX [IX_Fresenius4008S_DataPoints_SessionId] 
ON [dbo].[Fresenius4008S_DataPoints] ([SessionId]);

CREATE NONCLUSTERED INDEX [IX_Fresenius4008S_DataPoints_Timestamp] 
ON [dbo].[Fresenius4008S_DataPoints] ([Timestamp]);

CREATE NONCLUSTERED INDEX [IX_Fresenius4008S_DataPoints_PatientDevice] 
ON [dbo].[Fresenius4008S_DataPoints] ([PatientId], [DeviceId]);

-- Create a view for easy querying of the latest data points per patient/device
CREATE VIEW [dbo].[vw_Fresenius4008S_LatestDataPoints] AS
SELECT 
    f.*,
    ROW_NUMBER() OVER (PARTITION BY f.PatientId, f.DeviceId ORDER BY f.Timestamp DESC) as RowNum
FROM [dbo].[Fresenius4008S_DataPoints] f
WHERE f.IsActive = 1 AND f.IsDeleted = 0;

-- Create a stored procedure for inserting data points
CREATE PROCEDURE [dbo].[sp_InsertFresenius4008SDataPoint]
    @PatientId NVARCHAR(50),
    @DeviceId NVARCHAR(50),
    @SessionId NVARCHAR(50),
    @DeviceModel NVARCHAR(50) = 'Fresenius 4008 S',
    @DeviceVersion NVARCHAR(20) = '1.0',
    @ImageUri NVARCHAR(500) = NULL,
    @ProcessingTime DECIMAL(8,2) = NULL,
    @ModelUsed NVARCHAR(100) = NULL,
    @ConfidenceScore DECIMAL(3,2) = NULL,
    @CreatedBy NVARCHAR(100) = NULL,
    
    -- Original 4008S Data Points
    @KtV DECIMAL(5,2) = NULL,
    @PlasmaNA DECIMAL(5,2) = NULL,
    @GoalIn NVARCHAR(10) = NULL,
    @Clearance DECIMAL(6,2) = NULL,
    @UFVolume DECIMAL(8,2) = NULL,
    @UFTimeLeft NVARCHAR(10) = NULL,
    @UFRate DECIMAL(6,2) = NULL,
    @UFGoal DECIMAL(8,2) = NULL,
    @EffBloodFlow DECIMAL(6,2) = NULL,
    @CumBloodVol DECIMAL(6,2) = NULL,
    @BloodPressureSys DECIMAL(5,2) = NULL,
    @BloodPressureDia DECIMAL(5,2) = NULL,
    @BloodPressureMap DECIMAL(5,2) = NULL,
    @BloodPressurePulse DECIMAL(5,2) = NULL,
    @QB DECIMAL(6,2) = NULL,
    @Anticoagulant DECIMAL(5,2) = NULL,
    @ArterialPressure DECIMAL(6,2) = NULL,
    @VenousPressure DECIMAL(6,2) = NULL,
    @TMP DECIMAL(6,2) = NULL,
    @Conductivity DECIMAL(5,2) = NULL,
    
    -- New Data Points for Newer 4008S Versions
    @BPMSys DECIMAL(5,2) = NULL,
    @BPMDia DECIMAL(5,2) = NULL,
    @Dilution NVARCHAR(10) = NULL,
    @BaseNA DECIMAL(5,2) = NULL,
    @PrescribedNA DECIMAL(5,2) = NULL,
    @Bicarbonate DECIMAL(5,2) = NULL,
    @Temperature DECIMAL(4,2) = NULL,
    @DialysateFlow DECIMAL(6,2) = NULL,
    @NAProfile DECIMAL(3,1) = NULL,
    @StartNA DECIMAL(5,2) = NULL,
    @CDSStatus NVARCHAR(10) = NULL,
    @EmptyBIBAG NVARCHAR(10) = NULL,
    @ConductivityWindow DECIMAL(5,2) = NULL,
    
    @NewId UNIQUEIDENTIFIER OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        INSERT INTO [dbo].[Fresenius4008S_DataPoints] (
            [PatientId], [DeviceId], [SessionId], [DeviceModel], [DeviceVersion],
            [ImageUri], [ProcessingTime], [ModelUsed], [ConfidenceScore], [CreatedBy],
            [KtV], [PlasmaNA], [GoalIn], [Clearance], [UFVolume], [UFTimeLeft], [UFRate], [UFGoal],
            [EffBloodFlow], [CumBloodVol], [BloodPressureSys], [BloodPressureDia], [BloodPressureMap], [BloodPressurePulse],
            [QB], [Anticoagulant], [ArterialPressure], [VenousPressure], [TMP], [Conductivity],
            [BPMSys], [BPMDia], [Dilution], [BaseNA], [PrescribedNA], [Bicarbonate], [Temperature],
            [DialysateFlow], [NAProfile], [StartNA], [CDSStatus], [EmptyBIBAG], [ConductivityWindow]
        )
        VALUES (
            @PatientId, @DeviceId, @SessionId, @DeviceModel, @DeviceVersion,
            @ImageUri, @ProcessingTime, @ModelUsed, @ConfidenceScore, @CreatedBy,
            @KtV, @PlasmaNA, @GoalIn, @Clearance, @UFVolume, @UFTimeLeft, @UFRate, @UFGoal,
            @EffBloodFlow, @CumBloodVol, @BloodPressureSys, @BloodPressureDia, @BloodPressureMap, @BloodPressurePulse,
            @QB, @Anticoagulant, @ArterialPressure, @VenousPressure, @TMP, @Conductivity,
            @BPMSys, @BPMDia, @Dilution, @BaseNA, @PrescribedNA, @Bicarbonate, @Temperature,
            @DialysateFlow, @NAProfile, @StartNA, @CDSStatus, @EmptyBIBAG, @ConductivityWindow
        );
        
        SET @NewId = SCOPE_IDENTITY();
        
        SELECT 
            'Success' as Status,
            @NewId as NewId,
            'Data point inserted successfully' as Message;
            
    END TRY
    BEGIN CATCH
        SELECT 
            'Error' as Status,
            NULL as NewId,
            ERROR_MESSAGE() as Message;
    END CATCH
END;

-- Create a stored procedure for retrieving latest data points
CREATE PROCEDURE [dbo].[sp_GetFresenius4008SLatestDataPoints]
    @PatientId NVARCHAR(50),
    @DeviceId NVARCHAR(50) = NULL,
    @SessionId NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 *
    FROM [dbo].[Fresenius4008S_DataPoints]
    WHERE [PatientId] = @PatientId
        AND (@DeviceId IS NULL OR [DeviceId] = @DeviceId)
        AND (@SessionId IS NULL OR [SessionId] = @SessionId)
        AND [IsActive] = 1 
        AND [IsDeleted] = 0
    ORDER BY [Timestamp] DESC;
END;

-- Create a stored procedure for retrieving data points by date range
CREATE PROCEDURE [dbo].[sp_GetFresenius4008SDataPointsByDateRange]
    @PatientId NVARCHAR(50),
    @DeviceId NVARCHAR(50) = NULL,
    @StartDate DATETIME2(7),
    @EndDate DATETIME2(7)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT *
    FROM [dbo].[Fresenius4008S_DataPoints]
    WHERE [PatientId] = @PatientId
        AND (@DeviceId IS NULL OR [DeviceId] = @DeviceId)
        AND [Timestamp] >= @StartDate
        AND [Timestamp] <= @EndDate
        AND [IsActive] = 1 
        AND [IsDeleted] = 0
    ORDER BY [Timestamp] DESC;
END;


